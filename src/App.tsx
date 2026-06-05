/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import StudentDashboardPage from './pages/StudentDashboardPage';

export default function App() {
  return (
    <div className="flex bg-[#F8FAFC] min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main>
          <StudentDashboardPage />
        </main>
      </div>
    </div>
  );
}

