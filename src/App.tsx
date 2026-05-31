import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ValuesPage from './pages/ValuesPage';
import PropertiesPage from './pages/PropertiesPage';
import RoutinePage from './pages/RoutinePage';
import TasksPage from './pages/TasksPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ValuesPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="routine" element={<RoutinePage />} />
          <Route path="tasks" element={<TasksPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
