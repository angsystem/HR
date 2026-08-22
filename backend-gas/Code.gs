// ANG HR GAS 主入口：只接收 HTTP，不寫任何 LINE／Flutter／Web 細節。
function doGet(e) {
  return routeHttpRequest_(e, 'GET');
}

function doPost(e) {
  return routeHttpRequest_(e, 'POST');
}
