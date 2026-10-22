import { NavLink } from 'react-router-dom';
import { CalendarOutlined, ProjectOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import './planning.css';

export default function AgendaLayout({ children, error }) {
  return (
    <div className="page-wrapper agenda-page">
      <div className="content">
        <header className="agenda-header">
          <div className="agenda-brand">
            <span className="agenda-brand-icon">
              <CalendarOutlined />
            </span>
            <div>
              <h1>AGENDA</h1>
              <p>A little clarity for every day.</p>
            </div>
          </div>
          <nav className="agenda-tabs" aria-label="Agenda views">
            <NavLink to="/agenda/tasks">
              <ProjectOutlined /> Tasks board
            </NavLink>
            <NavLink to="/agenda/calendar">
              <CalendarOutlined /> Calendar
            </NavLink>
          </nav>
        </header>
        {error && <Alert type="error" showIcon message={error} className="agenda-error" />}
        {children}
      </div>
    </div>
  );
}
