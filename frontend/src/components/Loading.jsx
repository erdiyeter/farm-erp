function Loading({ text = "Loading...", className = "" }) {
  return <p className={className}>{text}</p>;
}

export default Loading;