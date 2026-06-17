import { Link } from "react-router-dom";

function ButtonLink({ to, variant = "primary", children }) {
  const className = variant === "secondary" ? "secondary-button" : "primary-button";

  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  );
}

export default ButtonLink;