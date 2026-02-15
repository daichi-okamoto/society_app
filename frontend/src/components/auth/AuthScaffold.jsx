import { Link } from "react-router-dom";

export default function AuthScaffold({
  title,
  subtitle,
  termsLead,
  children,
  afterForm,
  termsClassName = "",
  panelClassName = ""
}) {
  return (
    <div className="login-sp-screen">
      <div className={`login-sp-panel ${panelClassName}`.trim()}>
        <div className="login-sp-hero">
          <div className="login-sp-icon-wrap">
            <span className="material-symbols-outlined">sports_soccer</span>
          </div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {children}
        {afterForm}

        <div className={`login-sp-terms ${termsClassName}`.trim()}>
          {termsLead}
          <br />
          <Link to="/terms">利用規約</Link>と<Link to="/privacy">プライバシーポリシー</Link>に
          <br />
          同意したことになります
        </div>

        <div className="login-sp-blur top-left" />
        <div className="login-sp-blur bottom-right" />
      </div>
    </div>
  );
}
