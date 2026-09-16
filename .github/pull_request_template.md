## Description
<!-- Provide a brief description of the changes introduced by this PR. -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Firmware / Hardware integration update

## Validation & Testing
- [ ] `npm run build` completed with zero TypeScript or Vite errors.
- [ ] `npm run lint` passed.
- [ ] Edge safety invariants preserved: firmware buzzer/LED triggers independently of host state.
- [ ] Tested on physical hardware (if applicable):
  - Microcontroller: Arduino Nano (ATmega328P)
  - Sensors: MQ-2 (`A0`), DHT11 (`D2`)
  - Baud rate: 9600 baud

## Checklist
- [ ] My code follows the style guidelines of this project.
- [ ] I have performed a self-review of my own code.
- [ ] I have commented my code, particularly in hard-to-understand areas.
- [ ] I have updated corresponding documentation if needed.
