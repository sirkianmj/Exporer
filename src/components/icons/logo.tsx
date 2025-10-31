export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M6 4H8V20H6V4Z" fill="currentColor" />
      <path
        d="M16.2426 13.4142L8.82843 20.8284L7.41421 19.4142L14.8284 12L7.41421 4.58579L8.82843 3.17157L16.2426 10.5858L18.364 8.46447L19.7782 9.87868L17.6569 12L19.7782 14.1213L18.364 15.5355L16.2426 13.4142Z"
        fill="currentColor"
      />
    </svg>
  );
}
