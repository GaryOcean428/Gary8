import React from 'react';
import App from './App';
import { Animation } from './components/Animation';

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'animation',
        element: <Animation />,
      }
    ]
  }
];