export default function BDDateTime(date) {
  const now = date ? new Date(date) : new Date();

  const pad = (n) => (n < 10 ? `0${n}` : n);

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  // const hour = pad(now.getHours());
  // const minute = pad(now.getMinutes());

  return `${year}-${month}-${day} `;
}
// ${hour}:${minute}
