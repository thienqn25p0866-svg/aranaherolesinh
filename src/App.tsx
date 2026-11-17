/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ArenaApp from './arena/ArenaApp.jsx';
import GoogleAuthBridge from './arena/GoogleAuthBridge.tsx';

export default function App() {
  if (
    typeof window !== 'undefined' &&
    /^https?:$/i.test(window.location.protocol || '') &&
    new URLSearchParams(window.location.search).get('arena_auth_bridge') === '1'
  ) {
    return <GoogleAuthBridge />;
  }
  return <ArenaApp />;
}
