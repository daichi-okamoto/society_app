import { Navigate, Route, Routes, matchPath, useLocation } from "react-router-dom";
import { useEffect } from "react";
import PublicLayout from "./layouts/PublicLayout";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import { RequireAdmin, RequireAuth } from "./routes/guards";

import Home from "./pages/public/Home";
import ResultsArchive from "./pages/public/ResultsArchive";
import TournamentDetail from "./pages/public/TournamentDetail";
import Results from "./pages/public/Results";
import Announcements from "./pages/public/Announcements";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminRegister from "./pages/admin/AdminRegister";

import MyPage from "./pages/app/MyPage";
import Teams from "./pages/app/Teams";
import TeamNew from "./pages/app/TeamNew";
import TeamDetail from "./pages/app/TeamDetail";
import TeamJoin from "./pages/app/TeamJoin";
import TeamRequests from "./pages/app/TeamRequests";
import TeamTransfer from "./pages/app/TeamTransfer";
import TeamMembers from "./pages/app/TeamMembers";
import TeamMemberManualAdd from "./pages/app/TeamMemberManualAdd";
import TeamMemberEdit from "./pages/app/TeamMemberEdit";
import TeamEdit from "./pages/app/TeamEdit";
import AppHome from "./pages/app/AppHome";
import Tournaments from "./pages/app/Tournaments";
import TournamentEntry from "./pages/app/TournamentEntry";
import TournamentEntryConfirm from "./pages/app/TournamentEntryConfirm";
import TournamentEntryComplete from "./pages/app/TournamentEntryComplete";
import TournamentEntryReview from "./pages/app/TournamentEntryReview";
import TournamentEntryRoster from "./pages/app/TournamentEntryRoster";
import Payment from "./pages/app/Payment";
import PaymentAddCard from "./pages/app/PaymentAddCard";
import TournamentPaymentCheckout from "./pages/app/TournamentPaymentCheckout";
import TournamentImages from "./pages/app/TournamentImages";
import NotificationCenter from "./pages/app/NotificationCenter";
import HelpContact from "./pages/app/HelpContact";
import LegalPolicies from "./pages/app/LegalPolicies";
import ProfileEdit from "./pages/app/ProfileEdit";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTournaments from "./pages/admin/AdminTournaments";
import AdminTournamentDetail from "./pages/admin/AdminTournamentDetail";
import AdminTournamentCreate from "./pages/admin/AdminTournamentCreate";
import AdminEntries from "./pages/admin/AdminEntries";
import AdminTeams from "./pages/admin/AdminTeams";
import AdminTeamDetail from "./pages/admin/AdminTeamDetail";
import AdminPendingTeams from "./pages/admin/AdminPendingTeams";
import AdminPendingTeamDetail from "./pages/admin/AdminPendingTeamDetail";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminResults from "./pages/admin/AdminResults";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminImages from "./pages/admin/AdminImages";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminExports from "./pages/admin/AdminExports";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminNotificationCreate from "./pages/admin/AdminNotificationCreate";

const TITLE_PREFIX = "高森ソサイチ";

const TITLE_PATTERNS = [
  { pattern: "/admin/notifications/new", title: "通知作成" },
  { pattern: "/admin/teams/pending/:id", title: "承認待ちチーム詳細" },
  { pattern: "/admin/teams/pending", title: "承認待ちチーム" },
  { pattern: "/admin/tournaments/new", title: "大会新規作成" },
  { pattern: "/admin/tournaments/:id", title: "大会詳細" },
  { pattern: "/admin/teams/:id", title: "チーム詳細" },
  { pattern: "/admin", title: "管理ダッシュボード" },
  { pattern: "/admin/tournaments", title: "大会管理" },
  { pattern: "/admin/entries", title: "エントリー管理" },
  { pattern: "/admin/teams", title: "チーム管理" },
  { pattern: "/admin/matches", title: "対戦スケジュール" },
  { pattern: "/admin/results", title: "結果管理" },
  { pattern: "/admin/announcements", title: "お知らせ管理" },
  { pattern: "/admin/messages", title: "メッセージ管理" },
  { pattern: "/admin/images", title: "画像管理" },
  { pattern: "/admin/payments", title: "決済管理" },
  { pattern: "/admin/exports", title: "データ出力" },
  { pattern: "/admin/notifications", title: "通知管理" },
  { pattern: "/admin/login", title: "管理者ログイン" },
  { pattern: "/admin/register", title: "管理者登録" },
  { pattern: "/teams/:id/members/manual-add", title: "メンバー手動追加" },
  { pattern: "/teams/:id/members/:memberId/edit", title: "メンバー編集" },
  { pattern: "/teams/:id/members", title: "チームメンバー" },
  { pattern: "/teams/:id/requests", title: "参加リクエスト" },
  { pattern: "/teams/:id/transfer", title: "代表移譲" },
  { pattern: "/teams/:id/join", title: "チーム参加" },
  { pattern: "/teams/:id/edit", title: "チーム編集" },
  { pattern: "/teams/:id", title: "チーム詳細" },
  { pattern: "/teams/new", title: "チーム作成" },
  { pattern: "/tournaments/:id/entry/confirm", title: "エントリー確認" },
  { pattern: "/tournaments/:id/entry/complete", title: "エントリー完了" },
  { pattern: "/tournaments/:id/entry/review/roster", title: "名簿確認" },
  { pattern: "/tournaments/:id/entry/review", title: "エントリー内容確認" },
  { pattern: "/tournaments/:id/entry", title: "大会エントリー" },
  { pattern: "/tournaments/:id/payment", title: "大会決済" },
  { pattern: "/tournaments/:id/images", title: "大会画像" },
  { pattern: "/tournaments/:id/results", title: "大会結果" },
  { pattern: "/tournaments/:id", title: "大会詳細" },
  { pattern: "/app/home", title: "ホーム" },
  { pattern: "/me/edit", title: "プロフィール編集" },
  { pattern: "/me", title: "マイページ" },
  { pattern: "/teams", title: "チーム" },
  { pattern: "/tournaments", title: "大会をさがす" },
  { pattern: "/notifications", title: "通知" },
  { pattern: "/help", title: "ヘルプ・お問い合わせ" },
  { pattern: "/payments/new-card", title: "カード登録" },
  { pattern: "/payments", title: "お支払い情報" },
  { pattern: "/results", title: "過去大会結果" },
  { pattern: "/announcements", title: "お知らせ" },
  { pattern: "/login", title: "ログイン" },
  { pattern: "/register", title: "新規登録" },
  { pattern: "/policies", title: "規約とポリシー" },
  { pattern: "/", title: "ホーム" },
];

function resolvePageTitle(pathname) {
  const match = TITLE_PATTERNS.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname));

  if (!match) {
    return TITLE_PREFIX;
  }

  return `${TITLE_PREFIX} | ${match.title}`;
}

function DocumentTitleManager() {
  const location = useLocation();

  useEffect(() => {
    document.title = resolvePageTitle(location.pathname);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <DocumentTitleManager />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/results" element={<ResultsArchive />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/tournaments/:id/results" element={<Results />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/policies" element={<LegalPolicies />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/app/home" element={<AppHome />} />
            <Route path="/me" element={<MyPage />} />
            <Route path="/me/edit" element={<ProfileEdit />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/teams/new" element={<TeamNew />} />
            <Route path="/teams/:id" element={<TeamDetail />} />
            <Route path="/teams/:id/join" element={<TeamJoin />} />
            <Route path="/teams/:id/requests" element={<TeamRequests />} />
            <Route path="/teams/:id/transfer" element={<TeamTransfer />} />
            <Route path="/teams/:id/members" element={<TeamMembers />} />
            <Route path="/teams/:id/members/manual-add" element={<TeamMemberManualAdd />} />
            <Route path="/teams/:id/members/:memberId/edit" element={<TeamMemberEdit />} />
            <Route path="/teams/:id/edit" element={<TeamEdit />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id/entry" element={<TournamentEntry />} />
            <Route path="/tournaments/:id/entry/confirm" element={<TournamentEntryConfirm />} />
            <Route path="/tournaments/:id/entry/complete" element={<TournamentEntryComplete />} />
            <Route path="/tournaments/:id/entry/review" element={<TournamentEntryReview />} />
            <Route path="/tournaments/:id/entry/review/roster" element={<TournamentEntryRoster />} />
            <Route path="/tournaments/:id/payment" element={<TournamentPaymentCheckout />} />
            <Route path="/tournaments/:id/images" element={<TournamentImages />} />
            <Route path="/notifications" element={<NotificationCenter />} />
            <Route path="/help" element={<HelpContact />} />
            <Route path="/payments" element={<Payment />} />
            <Route path="/payments/new-card" element={<PaymentAddCard />} />
          </Route>
        </Route>

        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/tournaments" element={<AdminTournaments />} />
            <Route path="/admin/tournaments/new" element={<AdminTournamentCreate />} />
            <Route path="/admin/tournaments/:id" element={<AdminTournamentDetail />} />
            <Route path="/admin/entries" element={<AdminEntries />} />
            <Route path="/admin/teams" element={<AdminTeams />} />
            <Route path="/admin/teams/:id" element={<AdminTeamDetail />} />
            <Route path="/admin/teams/pending" element={<AdminPendingTeams />} />
            <Route path="/admin/teams/pending/:id" element={<AdminPendingTeamDetail />} />
            <Route path="/admin/matches" element={<AdminMatches />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/messages" element={<AdminMessages />} />
            <Route path="/admin/images" element={<AdminImages />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/exports" element={<AdminExports />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/notifications/new" element={<AdminNotificationCreate />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
