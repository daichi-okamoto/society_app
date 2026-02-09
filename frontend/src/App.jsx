import { Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import { RequireAdmin, RequireAuth } from "./routes/guards";

import Home from "./pages/public/Home";
import TournamentDetail from "./pages/public/TournamentDetail";
import Results from "./pages/public/Results";
import Announcements from "./pages/public/Announcements";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import MyPage from "./pages/app/MyPage";
import Teams from "./pages/app/Teams";
import TeamNew from "./pages/app/TeamNew";
import TeamDetail from "./pages/app/TeamDetail";
import TeamJoin from "./pages/app/TeamJoin";
import TeamRequests from "./pages/app/TeamRequests";
import TeamTransfer from "./pages/app/TeamTransfer";
import Tournaments from "./pages/app/Tournaments";
import TournamentEntry from "./pages/app/TournamentEntry";
import Payment from "./pages/app/Payment";
import TournamentImages from "./pages/app/TournamentImages";
import NotificationCenter from "./pages/app/NotificationCenter";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTournaments from "./pages/admin/AdminTournaments";
import AdminEntries from "./pages/admin/AdminEntries";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminResults from "./pages/admin/AdminResults";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminImages from "./pages/admin/AdminImages";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminExports from "./pages/admin/AdminExports";
import AdminNotifications from "./pages/admin/AdminNotifications";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tournaments/:id" element={<TournamentDetail />} />
        <Route path="/tournaments/:id/results" element={<Results />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/me" element={<MyPage />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/teams/new" element={<TeamNew />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
          <Route path="/teams/:id/join" element={<TeamJoin />} />
          <Route path="/teams/:id/requests" element={<TeamRequests />} />
          <Route path="/teams/:id/transfer" element={<TeamTransfer />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:id/entry" element={<TournamentEntry />} />
          <Route path="/tournaments/:id/payment" element={<Payment />} />
          <Route path="/tournaments/:id/images" element={<TournamentImages />} />
          <Route path="/notifications" element={<NotificationCenter />} />
        </Route>
      </Route>

      <Route element={<RequireAdmin />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tournaments" element={<AdminTournaments />} />
          <Route path="/admin/entries" element={<AdminEntries />} />
          <Route path="/admin/teams" element={<AdminTeams />} />
          <Route path="/admin/matches" element={<AdminMatches />} />
          <Route path="/admin/results" element={<AdminResults />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/images" element={<AdminImages />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/exports" element={<AdminExports />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
        </Route>
      </Route>
    </Routes>
  );
}
