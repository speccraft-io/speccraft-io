// Places the order and shows each confirmation the server sends back.
const button = document.getElementById('place-order');
const status = document.getElementById('status');
const orders = document.getElementById('orders');
const continueLink = document.getElementById('continue');

button.addEventListener('click', async () => {
  status.textContent = 'Placing your order...';
  const response = await fetch('/orders', { method: 'POST' });
  const { id } = await response.json();
  const item = document.createElement('li');
  item.className = 'order';
  item.textContent = `Order ${id} confirmed`;
  orders.append(item);
  status.textContent = 'Thank you!';
  button.hidden = true;
  continueLink.hidden = false;
});
