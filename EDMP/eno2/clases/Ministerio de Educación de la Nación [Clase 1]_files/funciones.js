var ID_USUARIO = 'int3873';

var page = location.pathname.substring(1);
if (page == 'perfil.cgi') {
  document.observe('dom:loaded', function(){
    var cusid_ele = document.getElementsByClassName('LinkPerfil');
    for (var i = 0; i < cusid_ele.length; ++i) {
      var item = cusid_ele[i];
      if (item.href.indexOf("MailTo({to:'" + ID_USUARIO + "'") > -1) {
        item.setAttribute("style", "display:none;");
      }
    }
  });
}
