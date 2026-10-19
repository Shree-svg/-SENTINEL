import os
import re
import base64
import subprocess

REPORT_MD = 'docs/report/SENTINEL_Project_Report.md'
OUTPUT_HTML = 'docs/report/SENTINEL_Project_Report.html'
OUTPUT_PDF = 'docs/report/SENTINEL_Project_Report.pdf'

with open(REPORT_MD, 'r') as f:
    lines = f.readlines()

html_body = []
in_code = False
code_lang = ''
code_lines = []

def escape_html(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

for line in lines:
    stripped = line.rstrip()
    
    # Code block toggle
    if stripped.startswith('```'):
        if in_code:
            in_code = False
            code_str = escape_html('\n'.join(code_lines))
            html_body.append(f'<pre><code class="{code_lang}">{code_str}</code></pre>')
            code_lines = []
        else:
            in_code = True
            code_lang = stripped[3:].strip()
            code_lines = []
        continue
        
    if in_code:
        code_lines.append(stripped)
        continue
        
    # Headers
    if stripped.startswith('# '):
        html_body.append(f'<h1 class="title">{escape_html(stripped[2:])}</h1>')
    elif stripped.startswith('## '):
        html_body.append(f'<h2>{escape_html(stripped[3:])}</h2>')
    elif stripped.startswith('### '):
        html_body.append(f'<h3>{escape_html(stripped[4:])}</h3>')
    elif stripped.startswith('#### '):
        html_body.append(f'<h4>{escape_html(stripped[5:])}</h4>')
    elif stripped.startswith('---'):
        html_body.append('<hr/>')
    elif stripped.startswith('- ') or stripped.startswith('* '):
        html_body.append(f'<li>{escape_html(stripped[2:])}</li>')
    elif stripped.startswith('|') and stripped.endswith('|'):
        # Table row
        cells = [c.strip() for c in stripped[1:-1].split('|')]
        if all(re.match(r'^:?-+:?$', c) for c in cells if c):
            continue # separator
        cell_tags = ''.join(f'<td>{escape_html(c)}</td>' for c in cells)
        html_body.append(f'<tr>{cell_tags}</tr>')
    elif stripped == '':
        html_body.append('<p></p>')
    else:
        html_body.append(f'<p>{escape_html(stripped)}</p>')

# Wrap consecutive table rows
html_content = '\n'.join(html_body)
html_content = re.sub(r'(<tr>.*?</tr>(\s*<tr>.*?</tr>)*)', r'<div class="table-container"><table>\1</table></div>', html_content, flags=re.DOTALL)
html_content = re.sub(r'(<li>.*?</li>(\s*<li>.*?</li>)*)', r'<ul>\1</ul>', html_content, flags=re.DOTALL)

# Convert bold formatting **text**
html_content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html_content)
html_content = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html_content)
html_content = re.sub(r'`(.*?)`', r'<code>\1</code>', html_content)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SENTINEL — Final Academic Project Report</title>
<style>
  @page {{
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
  }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 11pt;
    padding: 0;
    margin: 0;
  }}
  h1.title {{
    font-size: 24pt;
    color: #0f172a;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 8px;
    margin-top: 0;
  }}
  h2 {{
    font-size: 16pt;
    color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 24pt;
    page-break-after: avoid;
  }}
  h3 {{
    font-size: 13pt;
    color: #0369a1;
    margin-top: 16pt;
    page-break-after: avoid;
  }}
  h4 {{
    font-size: 11pt;
    color: #334155;
    margin-top: 12pt;
    page-break-after: avoid;
  }}
  p, li {{
    color: #334155;
    text-align: justify;
  }}
  ul {{
    padding-left: 20px;
  }}
  pre {{
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px;
    font-size: 9pt;
    font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
    overflow-x: auto;
    page-break-inside: avoid;
  }}
  code {{
    background: #f1f5f9;
    padding: 2px 4px;
    border-radius: 4px;
    font-family: ui-monospace, Menlo, Monaco, Consolas, monospace;
    font-size: 9pt;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14pt 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 6px 10px;
    text-align: left;
  }}
  tr:nth-child(even) {{
    background-color: #f8fafc;
  }}
  hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20pt 0;
  }}
</style>
</head>
<body>
{html_content}
</body>
</html>
"""

with open(OUTPUT_HTML, 'w') as f:
    f.write(full_html)

print("Generated HTML:", OUTPUT_HTML)

# Run Chrome to print to PDF
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={OUTPUT_PDF}",
    "--no-pdf-header-footer",
    os.path.abspath(OUTPUT_HTML)
]

res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0 and os.path.exists(OUTPUT_PDF):
    size = os.path.getsize(OUTPUT_PDF)
    print(f"Generated PDF successfully: {OUTPUT_PDF} ({size} bytes)")
else:
    print("PDF generation failed:", res.stderr)
