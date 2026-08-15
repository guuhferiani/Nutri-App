import Sidebar from './Sidebar';

export default function Layout({ user, children }) {
  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <div className="main-wrapper">
        {children}
      </div>
    </div>
  );
}
