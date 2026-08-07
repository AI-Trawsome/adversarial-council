async function charge(customer, amount) {
  const res = await fetch("/api/charge", { method: "POST", body: JSON.stringify({ customer, amount }) });
  if (!res.ok) return charge(customer, amount); // retry
  return res.json();
}
module.exports = { charge };
