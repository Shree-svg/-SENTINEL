import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BellIcon, UserGroupIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const navItems = [
  { to: '/monitor', label: 'Monitor', icon: HomeIcon },
  { to: '/alerts', label: 'Alerts', icon: BellIcon },
  { to: '/caregiver', label: 'Caregiver', icon: UserGroupIcon },
  { to: '/admin', label: 'Admin', icon: Cog6ToothIcon },
];

export default function NavBar() {
  return (
    <nav className="bg-neutral-200 border-b border-neutral-300">
      <ul className="flex space-x-4 px-4 py-2">
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-1 px-3 py-2 rounded-md transition-colors duration-200 ${
                  isActive ? 'bg-brand-amber text-white' : 'text-neutral-800 hover:bg-neutral-300'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
