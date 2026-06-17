function ErrorMessage({ message, className = "" }) {
  return <p className={className}>Error: {message}</p>;
}

export default ErrorMessage;