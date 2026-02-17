import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const payments = [
  {
    id: "p1",
    status: "done",
    date: "本日 14:30",
    team: "FC東京ユナイテッド",
    tournament: "第5回 東京セブンズカップ (11/24)",
    amount: "¥15,000",
    method: "カード決済",
    methodIcon: "credit_card",
  },
  {
    id: "p2",
    status: "pending",
    date: "昨日 18:20",
    team: "渋谷シティFC",
    tournament: "平日ナイトカップ Vol.24",
    amount: "¥12,000",
    method: "当日払い",
    methodIcon: "storefront",
    actionLabel: "決済リンク再送",
  },
  {
    id: "p3",
    status: "done",
    date: "11/18 09:15",
    team: "横浜シーガルス",
    tournament: "U-12 ジュニアフットサル",
    amount: "¥10,000",
    method: "銀行振込",
    methodIcon: "account_balance",
  },
  {
    id: "p4",
    status: "refund",
    date: "11/17 21:00",
    team: "品川アローズ",
    tournament: "第5回 東京セブンズカップ (キャンセル)",
    amount: "-¥15,000",
    method: "カード返金",
    methodIcon: "credit_card",
    actionLabel: "返金処理を実行",
  },
  {
    id: "p5",
    status: "done",
    date: "11/16 11:45",
    team: "新宿ストライカーズ",
    tournament: "平日ナイトカップ Vol.23",
    amount: "¥12,000",
    method: "カード決済",
    methodIcon: "credit_card",
  },
];

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const visiblePayments = useMemo(() => {
    return payments.filter((item) => {
      const q = search.trim().toLowerCase();
      const bySearch = q.length === 0 ? true : `${item.team} ${item.tournament}`.toLowerCase().includes(q);
      const byFilter = filter === "all" ? true : item.status === filter;
      return bySearch && byFilter;
    });
  }, [search, filter]);

  return (
    <div className="adpay-root">
      <header className="adpay-header">
        <div className="adpay-header-row">
          <h1>決済管理</h1>
          <button type="button" className="adpay-filter-btn" aria-label="filter">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
        <div className="adpay-search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="チーム名・大会名で検索"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="adpay-filter-row">
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            すべて
          </button>
          <button type="button" className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>
            完了
          </button>
          <button type="button" className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>
            未完了
          </button>
          <button type="button" className={filter === "refund" ? "active" : ""} onClick={() => setFilter("refund")}>
            返金待ち
          </button>
        </div>
      </header>

      <main className="adpay-main">
        <section className="adpay-summary">
          <div className="bg-icon">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <p>2023年11月 月間総売上</p>
          <h2>¥ 1,245,000</h2>
          <div className="adpay-summary-grid">
            <div>
              <small>
                <i className="dot amber" />
                未決済件数
              </small>
              <strong>
                12 <span>件</span>
              </strong>
            </div>
            <div>
              <small>
                <i className="dot red" />
                返金処理待ち
              </small>
              <strong>
                3 <span>件</span>
              </strong>
            </div>
          </div>
        </section>

        <section className="adpay-list-wrap">
          <div className="adpay-list-head">
            <h3>最近の取引</h3>
            <button type="button">CSV出力</button>
          </div>

          <div className="adpay-list">
            {visiblePayments.map((item) => (
              <article key={item.id} className={`adpay-item ${item.status}`}>
                <div className="adpay-item-main">
                  <div>
                    <div className="adpay-meta">
                      <span className={`adpay-status ${item.status}`}>
                        {item.status === "done" ? "完了" : item.status === "pending" ? "未決済" : "返金待ち"}
                      </span>
                      <span className="adpay-date">{item.date}</span>
                    </div>
                    <h4>{item.team}</h4>
                    <p>{item.tournament}</p>
                  </div>
                  <div className="adpay-amount">
                    <strong>{item.amount}</strong>
                    <div>
                      <span className="material-symbols-outlined">{item.methodIcon}</span>
                      <span>{item.method}</span>
                    </div>
                  </div>
                </div>
                {item.actionLabel ? (
                  <div className="adpay-item-foot">
                    <button type="button" className={item.status === "refund" ? "danger" : ""}>
                      {item.actionLabel}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </main>

      <nav className="adpay-nav">
        <div className="adpay-nav-row">
          <Link to="/admin" className="adpay-nav-item">
            <span className="material-symbols-outlined">dashboard</span>
            <span>ダッシュ</span>
          </Link>
          <Link to="/admin/tournaments" className="adpay-nav-item">
            <span className="material-symbols-outlined">add_circle</span>
            <span>大会作成</span>
          </Link>
          <Link to="/admin/teams" className="adpay-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/admin/payments" className="adpay-nav-item active">
            <span className="material-symbols-outlined">payments</span>
            <span>決済</span>
          </Link>
          <Link to="/admin" className="adpay-nav-item">
            <span className="material-symbols-outlined">settings</span>
            <span>設定</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
