import { tAnimal as t } from "../i18n";

function ErrorMessage({ message, className = "" }) {
  return <p className={className}>{t("Error")}: {message}</p>;
}

export default ErrorMessage;
