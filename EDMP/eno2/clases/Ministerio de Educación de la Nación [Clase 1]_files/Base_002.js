/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
/*
 * www.e-ducativa.com
 */



/** @namespace Framework e-ducativa */
var Educativa = new Object;

/**
  @namespace Variables para determinar el tipo de browser (casi ni se usa)
  @property {Bool} isOpera
  @property {Bool} isWebKit
  @property {Bool} isOldWebKit
  @property {Bool} isIE
  @property {Bool} isIE6
  @property {Bool} isGecko
  @property {Bool} isMac
  @property {Bool} isAir
 */
Educativa.Browser = new (function(){
    var t = this, d = document, w = window, na = navigator, ua = na.userAgent;

    this.isOpera = w.opera && opera.buildNumber;
    this.isWebKit = /WebKit/.test(ua);
    this.isOldWebKit = t.isWebKit && !w.getSelection().getRangeAt;
    this.isIE = !t.isWebKit && !t.isOpera && (/MSIE/gi).test(ua) && (/Explorer/gi).test(na.appName);
    this.isIE6 = t.isIE && /MSIE [56]/.test(ua) && ! /MSIE [78]/.test(ua);
    this.isGecko = !t.isWebKit && /Gecko/.test(ua);
    this.isMac = ua.indexOf('Mac') != -1;
    this.isAir = /adobeair/i.test(ua);
    this.isChrome = (/Chrome/i).test(ua);
});


/**
 *  Sirve para implementar el patron Observable. Es una clase abstracta, debe ser heredada.
 *  @class
 *  */
Educativa.Observable = Class.create(
/** @lends Educativa.Observable# */
{
    observe : function(event, action){
        if ( Object.isUndefined( this._listeners ) )
            this._listeners = {};
        (this._listeners[event] = this._listeners[event] || []).push( action );
        return this;
    },
    fire : function( event, memo)
    {
        if ( Object.isUndefined( this._listeners )
          || Object.isUndefined(this._listeners[event]) ) return;

        var listeners = this._listeners[event];

        for( var i=0; i < listeners.length; i++ )
            listeners[i]( this, memo );

        return this;
    }
});

Educativa.Control = Class.create(Educativa.Observable,
/** @lends Educativa.Control#  */
{
    /**
    Clase base para los controles del formulario
    @deprecated en lo posible <span style="color:red;font-weight:bold;">NO UTILIZAR</span> en nuevos desarrollos.
    @constructs
    @extends Educativa.Observable
    */
    initialize : function(id){
       this.element = this.element || $(id);

       // indexo los controles para la funcion E() del prototype
       if (this.element) Educativa.Control.Objects[ id || this.element.identify() ] = this;
    }
});

Educativa.Control.Objects = {};

/**
 * La clase Elemento forma parte del DOM y es aumentada mediante prototype (y Educativa).
 * Aqui se documentan solo las funciones que agrega Educativa.
 * @name Element
 * @class */
Element.addMethods( {
    /** Alias de {@link Element#control}
        @memberOf Element# */
    E : function(element) {
        return Educativa.Control.Objects[element.id]
    },
    /** Devuelve la instancia de {@link Educativa.Control} asociada al objeto.
        @memberOf Element# */
    control : function(element){
        return Educativa.Control.Objects[element.id]
    }
} );

Educativa.Control.OverlayedDialog = Class.create(
/** @lends Educativa.Control.OverlayedDialog# */
{
    options : {
        title : '',
        content: '',
        width : false,
        height: false,
        min : 0,
        max : 100
    },
    /** @constructs */
    initialize : function(options)
    {
        Object.extend( this.options, options );

        var dg = this.element = new Element('div', { className : 'overlayed-dialog' });

        $('marco_principal').insert({before: dg});

        dg.hide();

        dg.update(
            '<div class="overlayed-dialog-title"></div>' +
            '<div class="overlayed-dialog-content"></div>'
        );

        this._title   = this.element.down();
        this._content = this.element.down().next();

        this.refresh();

    },
    refresh : function(){
        this.setContent(this.options.content);
        this.setTitle(this.options.title);
        this.element.setStyle({width:'', height : ''});

        this.setWidth(this.options.width ? this.options.width : this.element.getWidth() );
        this.setHeight(this.options.height ? this.options.height : this.element.getHeight() );
    },
    show : function()
    {
        this.lb = new lightbox( this.element.identify() );
        this.lb.activate()
        // $('contenedor').scrollTo();
    },
    hide : function()
    {
        this.lb.deactivate()
        this.element.hide();
    },
    setTitle : function(title)
    {
        this._title.update(this.options.title = title);
    },
    setContent: function(content)
    {
        this._content.update(this.options.content = content);
    },
    setWidth : function(w)
    {
        this.element.setStyle({width:w+'px',
            left:((document.viewport.getDimensions().width-w)/2)+'px'});
    },
    setHeight : function(h)
    {
        this.element.setStyle({height:h+'px',
            top:((document.viewport.getDimensions().height-h)/2)+'px'});
    }
});


/** @namespace  Funcionles utiles */
Educativa.Utils = {

  disable_input_file_keypress : function(){
    $$('input[type="file"]').invoke('observe','keydown',function(e){
        if ( e.keyCode != 9 ) Event.stop(e)
    });
  },

  /** Quita los tags html de un string */
  quitar_html_tags : function(str){
    var letters = str.split('');
    var estado = ''; //posibles estados: ''|tag|string
    var quote = '';
    var new_str = '';
    for ( var j=0; j < letters.length; ++j){
        var c = letters[j];
        switch( estado ){
            case '':
                if( c == '<') estado = 'tag';
                else new_str += c;
                break;
            case 'tag':
                if( c.match(/[\'\"]/) ){ /* ' // para que no me rompa el ue */
                    estado = 'string';
                    quote = c;
                }
                if( c == '>' ) estado = '';
                break;
            case 'string':
                if( c == quote) estado = 'tag';
                break;
            default:
                alert("epa epa!");
                break;
        }

    }
    return new_str;
  },

  /**  Funcion especifica (optima) para validar tiny vacio */
  check_empty_html_content: function (str){

    str = str.replace(/&nbsp;/g,'')

    var letters = str.split('');
    var estado = ''; //posibles estados: ''|tag|string
    var quote = '';

    // se permite que str sea solo un iframe, un flash, o una imagen
    var allowedTags = 'iframe|object|img|embed';
    var pattern = new RegExp ('<'+ allowedTags + '\.*' + '>');
    if( pattern.test(str) ) return false;

    for ( var j=0; j < letters.length; ++j){
        var c = letters[j];
        switch( estado ){
            case '':
                if( c == '<') estado = 'tag';
                else if( ! c.match(/\s/) ){
                    return false;
                };
                break;
            case 'tag':
                if( c.match(/['"]/) ){
                    estado = 'string';
                    quote = c;
                }
                if( c == '>' ) estado = '';
                break;
            case 'string':
                if( c == quote) estado = 'tag';
                break;
            default:
                alert("epa epa!");
                break;
        }
    }
    return true;
  },

  helpWin : null,

  closeWinHelp : function(){
    if (Educativa.Utils.helpWin != null && !Educativa.Utils.helpWin.closed)
        Educativa.Utils.helpWin.close();
  },

  // genera el codigo necesario para incrustar correctamente objetos SWF
  incrustar_swf : function( args ) {
      var add_params = '';
      if( args.params ) {
          args.params.each( function(p) {
              add_params += '<param name="' + p.name + '" value="' + p.value + '" />';
          });
      }

      var id = ''
      if( args.id ) id = 'id="' + args.id + '"';

      var code = '';
      if( Educativa.Browser.isIE ) {
          code = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" ' +
                  'width="' + args.width + '" height="' + args.height + '" ' + id + ">";
      } else {
          code = '<object type="application/x-shockwave-flash" data="' + args.src + '" ' +
                  'width="' + args.width + '" height="' + args.height + '" ' + id + ">";
      }

      return code + '<param name="movie" value="' + args.src + '"/>' + add_params + "</object>";
  },

  popUpHelp : function(strURL) {
    Educativa.Utils.closeWinHelp();
    var strOptions = '';
    var strHeight  = screen.height - 100;
    var strWidth   = screen.width  - 100;
    var strOptions = 'scrollbars,resizable,status,height=' + strHeight + ',width=' + strWidth +
     ',left=50,top=50';
    try {
        Educativa.Utils.helpWin = window.open(strURL, 'helpWin', strOptions);
        Educativa.Utils.helpWin.focus();
    } catch(e){}
  },

  disable_links : function(element){
    $(element).select("a").each(function(item){
        item.observe('click', function(e){
            e.stop();
            alert( Educativa.Dict.LINKS_DESACTIVADOS_EN_LA_PREVISUALIZACION.capitalize());
            return true;
        });
        item.writeAttribute({title: item.readAttribute('href')});
        item.removeAttribute("href");
        item.setStyle({ textDecoration: 'underline' });
    });
  },

  uri_split : function(uri){
    var a = uri.match( /(?:([^:/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/ );
    return { scheme : a[1], authority : a[2], path : a[3], query : a[4], fragment : a[5] };
  },

  is_uri : function(value){
    if( ! value ) return false;
    //if( value.match(/[^a-z0-9\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\.\-\_\~\%]/i ) ) return false; //ver bug 5727
    if( value.match(/%[^0-9a-f]/i ) ) return false;
    if( value.match(/%[0-9a-f](:?[^0-9a-f]|$)/i ) ) return false;

    // from RFC 3986
    var uri = Educativa.Utils.uri_split( value );

    if( ! uri.authority ) return false;
    if( uri.authority.match(/\s/) ) return false;

    // scheme and path are required, though the path can be empty
    if ( !(uri.scheme != null && uri.scheme.length && uri.path != null) ) return false;

    // if authority is present, the path must be empty or begin with a /
    var slash_re = new RegExp( "^/" );
    if(uri.authority != null  && uri.authority.length )
    {
        if( !( uri.path.length == 0 || uri.path.match(slash_re ) ) ) return false;
        // el authority de las urls debe comenzar con una letra o numero
        if( uri.scheme == 'http' && !uri.authority.match(/^[a-zA-Z0-9]/) ) return false;
    }
    else
    {   // if authority is not present, the path must not start with //
        if ( uri.path.match(slash_re) ) return false;
    }

    // scheme must begin with a letter, then consist of letters, digits, +, ., or -
    if (! uri.scheme.toLowerCase().match('^[a-z][a-z0-9\+\-\.]*$') ) return false;

    return true;
  },

  is_link : function(value){
    if ( !value.match( '^(http://|https://)' ) ){
      return;
    }
    return Educativa.Utils.is_uri( value );
  },

  cleanCommentOnPasteFromWord : function (str) {
    var results = '';
    str = str.replace(/endif\]--> &lt;!--/ig, '[endif]--> <!--')
             .replace(/--&gt; <!--\[if/ig, '--> <!--[if' )
             .replace(/(accept-charset)\s*=\s*[\"\'].*?[\"\']/gi, "");

   try {
        HTMLParser( str , {
          start: function( tag, attrs, unary )
          {
            results += "<" + tag;
            for ( var i = 0; i < attrs.length; i++ )
              results += " " + attrs[i].name + '="' + attrs[i].escaped + '"';
            results += (unary ? "/" : "") + ">";
          },
          end: function( tag )
          {
            results += "</" + tag + ">";
          },
          chars: function( text )
          {
            results += text;
          },
          comment: function( text ) {}
        });
    }catch(e){
        alert(Educativa.Dict.translate('CONTENIDO_INVALIDO_PREVISUALIZACION'));
    }

    return results;
  },

  /** Actualmente esta funcion no hace nada. Devuelve el mismo codigo que recibe. Ver bug 5205.  */
  addWmodeToFlashObjects: function( html_content, ed ){
      return html_content;

      // Esto se desactivo a partir
      // del bug 5205 - INDF - No se aplican cambios en contenido HTML con FLASH incrustado (IE)
      /*
      var obj = new Element('div').update( html_content );
      var objects = obj.select('object');
      objects.each( function(e){
          if( e.readAttribute('classid') != 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000'){
              return;
          }
          e.writeAttribute('wmode','transparent')
          var wmode_present = false;
          e.childElements().each(function(c){

              if(     c.nodeName.toUpperCase() == 'PARAM'
                  && (c.readAttribute('name').toUpperCase() == 'wmode'.toUpperCase())
              ){
                  if(c.readAttribute('value') != 'transparent'){
                      c.writeAttribute('value','transparent')
                  }
                  wmode_present = true;
              }else if( c.nodeName.toUpperCase() == 'EMBED' ){
                  c.writeAttribute('wmode','transparent')
              }
          });

          if( !wmode_present){
              e.insert( new Element('param',{ name : 'wmode',value:'transparent'}) );
          }
      });
      return ed.serializer.serialize(obj);
      */
  },

  dateFormat: function( fecha ) {
      return Educativa.Utils.dateFormatDate(fecha)+' '+Educativa.Utils.dateFormatTime(fecha);
  },

  dateFormatDate: function( fecha ) {
      var mes = (fecha.getMonth()+1);
      var dia = fecha.getDate();
      return (dia<10?'0'+dia:dia)+'/'+(mes<10?'0'+mes:mes)+'/'+fecha.getFullYear();
  },

  dateFormatTime: function( fecha ) {
      var hora = fecha.getHours();
      var minuto = fecha.getMinutes();
      return (hora<10?'0'+hora:hora)+':'+(minuto<10?'0'+minuto:minuto);
  },

  /** Retorna el nombre del dia de la semana de una fecha.
      El invocador es responsable de cargar las traducciones de los terminos al javascript */
  dateFormatDayName: function( fecha ) {
      var dias = {
        0 : 'DOMINGO',
        1 : 'LUNES',
        2 : 'MARTES',
        3 : 'MIERCOLES',
        4 : 'JUEVES',
        5 : 'VIERNES',
        6 : 'SABADO'
      };

      return dias[fecha.getDay()].term();
  },

  /** Retorna el nombre del mes de una fecha, si se pasa el string 'short' en modo, usa nombres cortos para los meses.
      El invocador es responsable de cargar las traducciones de los terminos al javascript */
  dateFormatMonthName: function( fecha, modo ) {
      var meses = {
        0 : 'ENERO',
        1 : 'FEBRERO',
        2 : 'MARZO',
        3 : 'ABRIL',
        4 : 'MAYO',
        5 : 'JUNIO',
        6 : 'JULIO',
        7 : 'AGOSTO',
        8 : 'SEPTIEMBRE',
        9 : 'OCTUBRE',
        10 : 'NOVIEMBRE',
        11 : 'DICIEMBRE'
      };

      var mes = meses[fecha.getMonth()];

      if ( modo == 'short' ) mes += '_SHORT';

      return mes.termcap();
  },

  /** @param date Toma una fecha en formato '2010 10 31 14 05' (esto seria 2010/10/31 14:05) */
  parseDate: function(date){
    var arr = date.split(/ /);
    return new Date( arr[0], arr[1]-1, arr[2], arr[3], arr[4]);
  },

  /** Retorna una "DeepCopy" del objeto que deseamos, es decir, retorna una copia completa del objeto
      incluyendo sus propiedades  (Utilizado en el modulo de inscripcion) */
  deepCopy:function(obj){
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
  },

  /** Genera un id correspondiente al mail que se esta enviando
    @param lenght  la longitud del id
    @return {string}  el id de lenght caracteres , undef en caso de error
  */
  generar_id: function(cant){
      var list = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      return $R(1,cant).map(function(){
          return list.charAt( Math.floor(Math.random() * (list.length + 1)) );
      }).join('');
  },

  /**
   *  Determina si un elemento esta visible en un contenedor scrolleable
   *  @param element el elemento a verificar. Debe ser hijo de scrollParent
   *  @param scrollParent debe ser un contenedor scroleable (overflow auto).
   *  @return {Bool} Indica se encuentra o no visible
   */
  isInScrollView: function(element, scrollParent) {
      return (element.offsetTop + element.getHeight() > scrollParent.scrollTop+ scrollParent.getHeight())
             || (element.offsetTop < scrollParent.scrollTop);
  },

  /** reemplaza \n por &lt;br/&gt; */
  ln2br: function( s ) {
    while (s.indexOf("\n") > -1)
        s = s.replace("\n","<br />");
    return s;
  },

  /**
   *  Determina si una direccion de email es valida
   *  @param email la direccion a verificar.
   *  @return {Bool} Indica si es valida o no
   */
  is_email : function(email){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{1,}))$/;
    var s = re.test(email);
    return s;
  },

  validar_clave: function(args){

    var ret_val = {
        valid: true,
        mssg: ''
    }
    //validamos la clave
    if( args.confirmacion && args.clave != args.confirmacion ){
        ret_val.valid = false;
        ret_val.mssg = 'LA_CLAVE_Y_SU_VERIFICACION_NO_COINCIDEN'.term();
    }

    if( args.clave.length < args.passwd_len ){
        ret_val.valid = false;
        ret_val.mssg = 'LA_CLAVE_DEBE_CONTENER_AL_MENOS_N_CARACTERES'.term().interpolate({ cant: args.passwd_len });
    }

    var pw_v_c = new RegExp(args.passwd_valid_chars);
    if( ! pw_v_c.test( args.clave ) ){
        ret_val.valid = false;
        ret_val.mssg = 'LA_CLAVE_CONTIENE_CARACTERES_INVALIDOS'.term();
    }

    var id_re;
    if( args.passwd_id_policy == 'CONTAINS' ){
        id_re = new RegExp(args.user);
    }else if( args.passwd_id_policy == 'EQUAL'){
        id_re = new RegExp('^'+args.user+'$');
    }

    if( id_re && id_re.test( args.clave ) ){
        ret_val.valid = false;
        ret_val.mssg = 'CLAVE_CONTIENE_ID_USUARIO'.term();
      }

    return ret_val;
  },

  valida_id_usuario: function(id){
    return !(id.length < 3 || id.length > 30 || /[^a-z|0-9|\_|\.|\@|\-]/.test(id));
  },

  /**
   *  Setea el placeholder de un input, en caso que el navegados no lo soporte lo simula
   *  @param elm elemento al cual se le setea el placeholder.
   *  @param ph texto a visualizar como placeholder.
  */
  set_placeholder: function(elm, ph){
      elm.writeAttribute({placeholder: ph});
      var _test = document.createElement('input');
      if( ! ('placeholder' in _test) ){
          if($F(elm) == ''){
              var colorOriginal = elm.getStyle('color');
              var phText = elm.readAttribute('placeholder');
              elm.setStyle('color:gray').setValue(phText);
              elm.observe('focus',function(evt){
                  if($F(this) == phText){
                      this.clear().setStyle({color: colorOriginal});
                  }
              });
              elm.observe('blur', function(evt){
                  if($F(this) == ''){
                      this.setValue(phText).setStyle('color:gray');
                  }
              });
          }
          if( elm.up('form') ){
              elm.up('form').observe('submit', function(evt){
                  evt.stop();
                  Educativa.Utils.unset_placeholder(elm);
                  this.submit();
              });
          }
      }
  },

  /**
   *  Se encarga de quitar el placeholder simulado con set_placeholder, para los navegadores que no soporten la propiedad
   *  en caso que el submit del furmulario se maneje de alguna manera especial
   *  @param elm elemento al cual se le quita el placeholder.
   *  @param ph texto a visualizar como placeholder.
  */
  unset_placeholder: function(elm){
    var _test = document.createElement('input');
    if( ! ('placeholder' in _test) ){
        if($F(elm) == elm.readAttribute('placeholder')) elm.clear();
    }
  }

};

/** @class  */
Educativa.Debug =
/** @lends Educativa.Debug */
{
  clear : function(o){
        if ($('DivDebug')) $('DivDebug').innerHTML='';
    },
  show : function(o){
    var d;
    if (!$('DivDebug')){
        d = document.createElement('pre');
        d.id = 'DivDebug';
        d.style.position = 'fixed'
        d.style.left     = '10px';
        d.style.bottom   = '0';
        d.style.width    = '92%';
        d.style.height   = '200px';
        d.style.overflow = 'auto';

        d.style.fontSize = '11px';

        d.style.color    ='#FFFFFF';
        d.style.zIndex   ='1000';
        d.style.backgroundColor='pink';
        d.style.borderWidth='2px';
        d.style.borderColor ='black';
        d.style.borderStyle ='solid';
        /** @ignore */
        d.ondblclick = function(){ Element.hide(this); }

        document.body.style.paddingBottom = '200px';
        document.body.appendChild(d);
    } else {
        d = $('DivDebug');
    }
    d.show();
    var str="";

    if ( typeof o == 'string')
        str = o;
    else for(i in o)
            str += "\t" + i + " => " + o[i] + "\n";

    d.innerHTML +=  "\n" + str;
  }
};


/** @namespace */
Educativa.Session = {} ;

/** Determina si el encoding utilizado es utf8 o latin1 */
Educativa.utf8 = 0;

/** Manejo de los terminos de diccionario -
    Se debe evitar utilizar esta clase directamente para traducir terminos -
    Utilizar {@link String#term} o {@link String#termcap}
  @namespace */
Educativa.Dict = {
    /** Evitar este metodo.
        Utilizar {@link String#term} o {@link String#termcap}  */
    translate: function(t){
        return Educativa.Dict[t] ? Educativa.Dict[t] : '*' + t + '*';
    },
    add: function(term, traduccion){
        if( Object.isString(term) )
            Educativa.Dict[term] = traduccion;
        else
            Object.extend( Educativa.Dict, term );
    }
};

/* Extiende la clase String para menejar terminos de Diccionario */
Object.extend( String.prototype, {
    /** Traduce el termino segun el diccionario
        @example "TERMINO_DEL_DICC".term();
        @memberOf String#     */
    term : function() {return Educativa.Dict.translate(this);},
    /** Traduce el termino segun el diccionario y lo capitaliza
        @example "TERMINO_DEL_DICC".termcap();
        @memberOf String#     */
    termcap:  function() { return this.term().capitalize() ;}
} );


Educativa.Glosario = {};

if ( $('AyudaContextual')) Event.observe(window, 'load', function(){
    Event.observe(window, 'keypress', function(event) {
        if (event.charCode == 104) {
            Educativa.Utils.popUpHelp( $('AyudaContextual').href );
        }
    });

    $('AyudaContextual').onclick = function(){
        Educativa.Utils.popUpHelp( $('AyudaContextual').href );
        return false;
    }

});

/* Educativa.Alert */
(function(){
    var alertas = [];
    /** @class
     * @param options
     * @param [options.type="info"] Tipo de alerta
     * @param options.text Texto de el mensaje
     * */
    Educativa.Alert = Class.create(
    {
        options :
        {
            type : 'info',
            text : ''
        },
        initialize : function(options)
        {
            myself = this;
            myself.detallesVisibles = false;
            // si options es un string
            if ( typeof( options ) != 'object' ) options = { text : options };

            Object.extend( this.options, options );

            var content = new Element('div',{className: 'content'}).update( this.options.text );
            this.element = new Element('div', { className: 'alert '+ this.options.type , style: "display:none" })
                               .insert( content );

            if( this.options.log ) {

                var showHideButton = new Element('div', {className: 'AlertShowHideButton'} );

                var log_mssg = new Element('ul');
                var exists_detail = 0;
                this.options.log.each(function(e){
                    if( e.type == 'detail' ){
                        exists_detail = 1;
                        log_mssg.insert( new Element('li',{className: 'AlertLogDetail'}).update(e.text)) ;
                    }else{
                        log_mssg.insert( new Element('li',{className: 'AlertLogLi'}).update(e.text)) ;
                    }
                });

                if ( exists_detail == 1 ) {
                    showHideButton.update('[Mostrar Detalles]');
                }

                log_mssg.hide();

                var contentLog = new Element('div',{className:'AlertLogContent'})
                                     .insert( showHideButton )
                                     .insert( log_mssg );

                this.element.insert( contentLog );
                showHideButton.observe('click',function(){
                    if( myself.detallesVisibles ){
                        log_mssg.hide();
                        showHideButton.update('[Mostrar Detalles]');
                        myself.detallesVisibles = false;
                    }else{
                        log_mssg.show();
                        showHideButton.update('[Ocultar Detalles]');
                        myself.detallesVisibles = true;
                    }
                });
            }

            $('ajax_indicator').insert({ after : this.element });

            if (Effect) Effect.Pulsate(this.element.identify(),
                { pulses: 3, duration: .6 });

            this.element.show();
            alertas.push( this );
        },
        hide : function()
        {
            this.element.hide();
        }

    });

    Object.extend( Educativa.Alert, {
        hideAll : function()
        {
            alertas.invoke('hide');
        }
    });
})();



Educativa.Popup = Class.create(
/** @lends Educativa.Popup# */
{
    closed: function(){
        return this.window.closed;
    },
    /**
     * Sirve para abrir una nueva pagina en un popup
     * @constructs */
    initialize : function(options) {
        this.options = {
          url       : 'about:blank',
          width     : 600,
          height    : 500,
          name      : '_blank',
          location  : false,
          menubar   : false,
          toolbar   : false,
          status    : true,
          scrollbars: true,
          resizable : true,
          left      : 0,
          top       : 0,
          depend    : false,
          normal    : false,
          center    : true
        };

        Object.extend(this.options, options || {});

        if ( Educativa.id_grupo ) this.options.name += Educativa.id_grupo;

        if ( this.options.depend )
            Event.observe( window, 'unload', this.close.bind(this) )


        if (this.options.normal){
            this.options.menubar  = true;
            this.options.status   = true;
            this.options.toolbar  = true;
            this.options.location = true;
        }

        this.options.width
            = this.options.width < screen.availWidth
            ? this.options.width
            : screen.availWidth;

        this.options.height
            = this.options.height < screen.availHeight
            ? this.options.height
            : screen.availHeight;

        if ( this.options.center ){
            this.options.top  = (screen.availHeight - this.options.height + 1) / 2;
            this.options.left = (screen.availWidth  - this.options.width  + 1) / 2;
        }


        var openoptions =
            'width='       + this.options.width
          + ',height='     + this.options.height
          + ',location='   + (this.options.location   ? 'yes' : 'no')
          + ',menubar='    + (this.options.menubar    ? 'yes' : 'no')
          + ',toolbar='    + (this.options.toolbar    ? 'yes' : 'no')
          + ',scrollbars=' + (this.options.scrollbars ? 'yes' : 'no')
          + ',resizable='  + (this.options.resizable  ? 'yes' : 'no')
          + ',status='     + this.options.status ;

        if ( this.options.top != "" ) openoptions += ",top=" + this.options.top;
        if ( this.options.left!= "" ) openoptions += ",left="+ this.options.left;


        Educativa.Popup.Objects[this.options.name] = this;

        this.window = window.open(this.options.url, this.options.name,openoptions );

        return this.window;

    },
    reload : function( n ){
        ele = Educativa.Popup.get( n );
        setTimeout( function(){
            if ( this.window.closed && this.options.onClose )
                this.options.onClose();
            else if ( this.options.onReload )
                this.options.onReload();
        }.bind(ele), 1)
    },
    close : function(){

        if ( ! this.closed() )
            this.window.close();
    },
    focus : function(){
        this.window.focus();
        return this;
    },
    write : function (content) {
        var doc = this.window.document;
        doc.write(content);
        doc.close();
    }
});

Educativa.Popup.Objects = {};

Educativa.Popup.get = function(name){
    var r ;
    try {
        if ( ! Educativa.Popup.Objects[name].closed() )
            r = Educativa.Popup.Objects[name];
    } catch(e){}
    return r;
}

Educativa.Popup.open = function(opt){
    var name = opt.name;
    if ( Educativa.id_grupo ) name += Educativa.id_grupo;
    var w = Educativa.Popup.Objects[ name ];
    return  w && !w.closed()
        ? w.focus()
        : new Educativa.Popup( opt );
}


Educativa.Tooltips = [];
Educativa.Tooltip = Class.create(
/** @lends Educativa.Tooltip# */
{
    /**
    Esta clase se utiliza para crear los tooltips de la plataforma
    @constructs */
    initialize : function(options){
        this.options = {
            trigger   : null,
            html      : '',
            canFixed  : false
        };

        Object.extend( this.options, options );

        this.trigger = $(this.options.trigger);
        this.html    = this.options.html;

        var tt = this.element = new Element('div');
        tt.className = 'tooltip';
        tt.update(this.options.html);

        $(document.body).appendChild( tt );

        this.trigger.observe('mouseover', this.show.bindAsEventListener(this) );
        this.trigger.observe('mouseout', this.hide.bindAsEventListener(this) );
        this.trigger.observe('click', this.click.bindAsEventListener(this) );

        Educativa.Tooltips.push( this );

    },

    show : function(e){
        var tt = this.element, bt = this.trigger;
        tt.makePositioned();
        Position.clone( bt, tt, {
            setWidth:0,
            setHeight: 0,
            offsetLeft: 3,
            offsetTop: - 1 - tt.getHeight()
        });
        tt.setStyle({zIndex : 500});
        bt.addClassName('tooltip-button-over');
        if ( this.trigger.hasClassName('tooltip-fixed') ) return;
        tt.show();
    },
    hide : function(e){
        if ( this.trigger.hasClassName('tooltip-fixed') ) return ;
        this.trigger.removeClassName('tooltip-button-over');
        this.element.hide();
    },
    click : function(e){
        return;
    }

});

/* Lineas necesarias para documentas los eventos de la clase */
/**
 * Evento disparado casa vez que se oculta el popup
 * @name #hide
 * @event
*/

/**
 * Evento disparado casa vez que se muestra el popup
 * @name #render
 * @event
*/

Educativa.Tooltip.Menu = Class.create(
/** @lends Educativa.Tooltip.Menu# */
{
    /**
    Sirve para crear ventanas popups inline. Es una de las clases mas usuada, mas alla de que su nombre sugiere.<br/>
    Para que el mismo se vea se deben incluir los estilos correspondientes.
    @param options
    @param [options.trigger] Objeto o id que al ser clickeado disparara el popup
    @param [options.html=''] Codigo HTML u objetos que contendra el popup
    @param [options.over] Elemento sobre el cual se mostrara el popup. En caso de no especificarse se mostrara
                          sobre el trigger
    @param [options.offsetLeft=0] Corrimiento hacia la izquierza
    @param [options.offsetTop=0] Corrimiento hacia arriba
    @param [options.title=''] Titulo del popup
    @param [options.is_tooltip='false'] De ser true se muestrara solo mientras el cursor este sobre el mismo
    @param [options.center='false'] En caso de ser true el popup se mostrara centrado. No es compatible con la
                                    opcion <b>over</b>.
    @param [options.id=''] Id del div principal
    @param [options.className='tooltip'] Class name del div principal.
    @param [options.close_hd] Function para manejar el evento de cerrado.

    @borrows #event:hide as this.event:TooltipMenu:hide
    @borrows #event:render as this.event:TooltipMenu:render

    @constructs */
    initialize : function(options){
        this.options = {
            trigger   : null,
            html      : '',
            over      : null,
            offsetLeft: 0,
            offsetTop : 0 ,
            className : 'tooltip',
            title     : '',
            is_tooltip: false,
            center    : false,
            id        : false,
            close_hd  : null
        };

        Object.extend( this.options, options );
        //
        var options = this.options;
        var menu = this;
        if( ! this.options.over ) this.options.over = this.options.trigger;
        this.trigger = $(this.options.trigger);

        //dialog
        var tt = this.element = new Element('div');
        tt.className = options.className;
        if( options.id )
            tt.id = options.id;
        tt.hide();
        $(document.body).insert( tt );

        //container
        this.container = new Element('div',{ className: options.className + '_container'  });
        this.container.update(this.options.html);
        this.element.insert(this.container);

        // boton para cerrar la ventana
        this.title_bar = new Element('div', {className: options.className + '_title_bar'});
        this.b_close = new Element('a', {className: options.className + '_close_button'});

        this.title_bar
            .insert(this.title_container = new Element('span').update( options.title ) )
            .insert(this.b_close);
        tt.insert( this.title_bar );

        var trigger_event = options.is_tooltip ? 'mouseover' : 'click';

        if( this.trigger ){
            this.trigger.observe( trigger_event, this.raise_dialog.bindAsEventListener(this) );

            if( options.is_tooltip ){
                this.trigger.observe('mouseout', this.hide.bindAsEventListener(this) );
                tt.observe('mouseover', this.show.bindAsEventListener(this) );
            }
        }

        this.b_close.observe('click', this.hide.bindAsEventListener(this) );

        if (options.draggable) {
            this.title_bar.setStyle( {'cursor': 'move'} );
            new Draggable(tt, { handle: this.title_bar,revert: false });
        }

        //esta linea hace que cuando se salga de la caja la oculte
        //tt.observe('mouseout', this.hide.bindAsEventListener(this) );
    },

    /** Muestra el popup, correctamente ubicado */
    raise_dialog: function(){

        if (this.options.center) {
            var left = (document.viewport.getWidth() - this.element.getWidth())/2;
            var top = (document.viewport.getHeight() - this.element.getHeight())/2;
            if (top < 0) top = 0;
            this.element.setStyle({left: left+'px', top: top+'px'});
        } else {
            this.element.clonePosition( this.options.over, {
                setWidth:0,
                setHeight: 0,
                offsetLeft: this.options.offsetLeft,
                offsetTop: this.options.offsetTop
            });
        }

        var t = this;
        Effect.Appear( this.element, {
            duration :0.4,
            afterFinish: function(){
                t.container.fire('TooltipMenu:render');
            }
        });
    },
    /** Muestra el popup.
     * @see #raise_dialog
     * @private */
    show : function(){
        this.element.show();
    },
    /**
     * Oculta el popup */
    hide : function(){
        this.container.fire('TooltipMenu:hide');
        this.element.hide();
    },
    /** Actualiza el contenido del popup */
    update: function(content){
        this.container.update(content);
        //this.element.appendChild( this.b_close );
    },
    /** Setea la propiedad over del Pop */
    setOver: function(over){
        this.options.over = over;
    },
    setOffSetLeft: function(offset){
        this.options.offsetLeft= offset;
    },
    setTitle: function(title){
        this.title_container.update(title);
    }

});


/** Deshabilita los clicks derechos de los elementos que tengan la clase 'noRightClick'.
    Se llama automaticamente en el onload */
Educativa.disableRightClick = function (){
    $$('.noRightClick').each(function(e){
        /** @ignore */
        e.oncontextmenu=function(){return false}
    });
};
Event.observe(window, 'load', Educativa.disableRightClick );
Ajax.Responders.register({  onComplete: Educativa.disableRightClick });


/** Glosariza los elementos de la pagina que posean la clase 'TerminoGlosarizado'.
    Se llama automaticamente en el onload */
Educativa.agregar_glosario = function() {
    if (! $('marco_principal') ) return;
    var div = $('DivTerminoGlosarizado');
    if (!div){
        new Insertion.Before($('marco_principal'), '<div id="DivTerminoGlosarizado" style="display:none" ></div>');
        div = $('DivTerminoGlosarizado');
        div.makePositioned();
    }
    var tmpl = new Template(
           '<h6>#{id}</h6><p>#{desc}</p><em>'
        +  Educativa.Dict['CLICK_SOBRE_EL_TERMINO_PARA_VISUALIZAR_EL_GLOSARIO_COMPLETO']
        + '</em>'
    );

    $$('.TerminoGlosarizado').each(function(o){

        o.observe('mouseover', function(e){
            o.makePositioned();
            var offset = Position.realOffset(o);
            Position.clone( o, div, {
                setWidth  : 0,
                setHeight : 0,
                offsetLeft: 20,
                offsetTop : 20
            } );

            div.innerHTML = Educativa.Glosario[o.name]
                ? tmpl.evaluate(Educativa.Glosario[o.name])
                : '';
            div.show();
        });
        /** @ignore */
        o.onmouseout = function(){ div.hide(); }

        /** @ignore */
        o.onclick    = function(){
            window.open('glosario.cgi?id_curso=' + Educativa.id_grupo,
                        'glosario',
                        'width=350,height=450,scrollbars=yes');
            return false;
        }


    })
};
Event.observe(window, 'load', Educativa.agregar_glosario );
Ajax.Responders.register({  onComplete: Educativa.agregar_glosario });

//Esta varriable debe existir, ya que se usa (Ajax.Responders.unregister(uke_ajax_indicator_callbacks);)
//para desregistrar estos indicadores por defecto.
var uke_ajax_indicator_callbacks = {
/** @ignore */
    onCreate  : function(){ if($('ajax_indicator')) $('ajax_indicator').show() },
/** @ignore */
    onComplete: function(){ if($('ajax_indicator')) $('ajax_indicator').hide() }
};
Ajax.Responders.register(uke_ajax_indicator_callbacks);



/* Dios sabe para que se estara usando esto. Existe desde el principio de los tiempos. */
try{
if ( window.opener && window.name && window.opener.Educativa ){
    Event.observe( window, 'unload', function(){
        try{
            window.opener.Educativa.Popup.get( window.name ).reload(window.name);
        } catch(e){}
    });
}
} catch(e){}

/* Evita errores en caso de que no este activado el firebug, y se hayan dejado mesajes de debug */
if( Object.isUndefined( window.console ) ){
    window.console = {
        /** @ignore */
        log : function(){},
        /** @ignore */
        info : function(){}
    };
}

/* fixme: Funciones relacionados con eims aparentemente, podrian no estar aqui */
popupWins = new Array();

if(! window.windowOpener) windowOpener = function ( url, name, args)
{
    if ( typeof( popupWins[name] ) != "object" ){
        popupWins[name] = window.open(url,name,args);
    } else {
        if (!popupWins[name].closed){
            popupWins[name].focus();
        } else {
            popupWins[name] = window.open(url, name,args);
        }
    }
    popupWins[name].focus();
};

if (! window.OpenWin ) OpenWin = function () {
    switch ( id_usuario ){
        case "":
            alert(Educativa.Dict.translate('PARA_UTILIZAR_EL_CHAT_PRIMERO_DEBES_INGRESAR_A_LA_INTRANET'));
            break;
        case "_anonimo":
            alert(Educativa.Dict.translate('ESTA_FUNCION_NO_ESTA_DISPONIBLE_PARA_USUARIOS_ANONIMOS'));
            break;
        default:
            var windowX = (screen.width/2)-390;
            var windowY = (screen.availHeight/2)-285;
            windowOpener('location.cgi?wseccion=21'+'&id_curso='+id_grupo,
                          'Chat'+id_usuario+id_grupo,
                          'toolbar=0,location=0,directories=0,status=0,'+
                          'menubar=0,scrollbars=0,resizable=0,width=780,'+
                          'height=570,top='+windowY+',screenY='+windowY+
                          ',left='+windowX+',screenX='+windowX);
    }//end switch

}; //end OpenWin()

if(!window.MensajeInstantaneo) MensajeInstantaneo= function ( titulo, destino, asunto) {
    InstantaneaScript=url_dir+"nph-instantanea.cgi?wIdDestino="+destino+"&wAsunto="+asunto;
    if( confirm(titulo) ){ location.href = InstantaneaScript; }
};

if (! window.small_window ){
    /** Aparentemente utilizada para mostrar micrositios  */
    small_window = function ( myurl, ventana_x, ventana_y) {
        var winl = (screen.width - ventana_x) / 2;
        var wint = (screen.height - ventana_y) / 2;
        var props = 'scrollBars=yes,resizable=yes,toolbar=no,menubar=no,location=no,'+
                    'directories=no,width='+ventana_x+',height='+ventana_y+
                    ',top='+wint+',left='+winl;

        var uri = myurl.split(/[?#]/);
        if( uri[1] ){
            var query = uri[1].toQueryParams();
            query['id_curso'] = id_grupo;
            uri[1] = $H(query).toQueryString();
        }
        myurl = uri[0] +'?'+uri[1]+ (uri[2] ? '#'+uri[2] : '' );

        var newWindow = window.open(myurl, "microsite", props);
        newWindow.focus();
    };
}

// Agrega el color #CCC a los option desactivados, bug del IE
if ( Prototype.Browser.IE )
    Event.observe(window, 'load', function(){
        $$('select option').each(function(e){
            if(e.disabled) e.setStyle({color : "#CCC"});
        });
    });

/* se utiliza para los popups de ayuda donde la ventana es mas grande q en aula */
Event.observe(window, 'load', function(){
    var a = $$('#boton-ayuda a').first();
    if (a) a.observe('click',function(event){
        var aula_front_end = a.href.toQueryParams().section;
        event.stop();
        Educativa.Popup.open({
            url       : a.href,
            width     : aula_front_end ? 740 : screen.width-100,
            height    : aula_front_end ? 600 : screen.height-100,
            name      : '_blank',
            status    : false,
            resizable : true,
            left      : (screen.width/2)-370,
            top       : (screen.availHeight/2) - 300,
            depend    : false,
            center    : ! aula_front_end
        });
    })
})

/** se utiliza para abrir los popups de ayuda en aula */
Educativa.popupAyuda = function (args){

    var url = Educativa.url_ayuda;

    if( args.url )
        url = args.url;

    new Educativa.Popup({
        url : url,
        width : 740,
        height : 600,
        resizable: false,
        status : false
    });

    return;
}

/** Se utiliza para crear popups que permiten seleccionar elementos de una lista.<br/>
    <b>clase abstracta, debe ser heredara para funcionar</b>
   @param options Objeto con las siguietes propiedades:
   @param options.trigger   id del elemento que dispara la ventana
   @param options.container id del elemento en donde se insertan los elementos seleccionados
   @param options.ajax_url  url de donde se toman los elementos
   @param [options.page_limit=10]
   @param [options.className='list_select_dialog']
   @param [options.void_list_message="No existen items dispobibles"]
   @param [options.draggable=0] Permite arrastrar la ventana
   @param [options.offsetTop=0]
   @param [options.offsetLeft=0]
   @param [options.title=''] Titulo del popup
   @class
*/
Educativa.ListSelectDialog = Class.create(
/** @lends Educativa.ListSelectDialog# */
{

    initialize : function(args) {
        //parametros que recive
        var options = {
            trigger     : null,
            ajax_url    : null,
            page_limit  : 10,
            page_index  : 0,
            className   : 'list_select_dialog',
            void_list_message : "No existen items disponibles",
            draggable   : 0,
            offsetTop   : 0,
            offsetLeft  : 0,
            title       : '',
            lista       : null //array con los items disponibles
        };

        Object.extend(options,args); // para pisar los default
        Object.extend(this,options);


        this.menu = new Educativa.Tooltip.Menu({
            trigger   : $(this.trigger),
            html      : new Element('div',{ className: this.className+"_spinner" }),
            className : this.className,
            over      : $(this.trigger),
            offsetLeft: this.offsetLeft,
            offsetTop : this.offsetTop,
            draggable : this.draggable,
            title     : this.title
        });

        this.menu.container.observe(
            'TooltipMenu:render',
            this.render.bindAsEventListener(this )
        );

        var obj = this;
        if( this.lista == null ){
            new Ajax.Request(this.ajax_url, {
                method: 'get',
                onSuccess: function(transport) {
                    obj.lista = transport.responseText.evalJSON();
                    obj.load_items();
                }
            });
        }else{
            this.load_items();
        }

    },
    load_items: function() {
        var obj = this;
        var i = 0;
        $A(this.lista).findAll(function(c){ return c.asociado == 1 }).each(function(c){
            obj.asociar_item({ item :c, index: i++ });
        });
    },

    render: function(ev,argd_container) {
        var obj = this;

        if( obj.lista == null ){

            new Ajax.Request(this.ajax_url, {
                method: 'get',
                onSuccess: function(transport) {
                    obj.lista = transport.responseText.evalJSON();
                    obj.draw_items_list();
                }
            });

        }else{
            this.draw_items_list();
        }
    },

    draw_items_list: function( ){
        var obj = this;
        var cant_c = $A(this.lista).findAll(function(e){ return e.asociado == 0 }).size();
        if( cant_c == 0 ){
            this.menu.update( new Element('div').update( this.void_list_message ));
            return;
        }
        if( this['empty_body_message'] && cant_c == this.lista.length ) this.empty_body_message();
        //chequeaos basicos
        if( this.page_index >= cant_c ){ this.page_index -= this.page_limit ; }
        if( this.page_index < 0       ){ this.page_index = 0; }

        var div = new Element('div');
        var list = new Element('ul');

        var items = $A(this.lista).
            findAll(function(e){ return e.asociado == 0 }).
            sort( function(a,b){ return a.nombre.localeCompare(b.nombre); } );

        for( var i = this.page_index; items[i] &&  i < (this.page_index+this.page_limit) ; ++i){
            var e = items[i];
            var li = new Element('li',
                    { id: "curso_"+e.id , className: e.estado ? this.className+'_item_'+(i%2?'impar':'par'): 'grupo_inactivos_control' }
            );

            list.insert(
                li.insert( new Element('span').update(e.nombre+ ' ') )
            );

            li.observe('click', obj.asociar_item.bind(obj, { item: e} ) );

            if( this['item_decorator'] ) this.item_decorator( li, e);
        }

        div.insert(list);

        // paginador
        var pie = new Element('div',{ className: this.className + '_footer' });

        if( this.page_index > 0 ){
            var atras    = new Element('span',{ className: this.className + '_back'  }).update(' << ');
            atras.observe('click', this.retroceder_pagina.bindAsEventListener(this) );
            pie.insert(atras);
        }

        pie.insert(new Element('span').update(
            Educativa.Dict.PAGINA_DE.interpolate({
                nro:'<span style="font-weight: bold" >'+
                     ((this.page_index/this.page_limit)+1).floor()
                    +'</span>' ,
                total: (cant_c/this.page_limit).ceil()
                }).capitalize()
        ));

        if( cant_c > (this.page_index+this.page_limit) ){
            var adelante = new Element('span',{ className: this.className + '_next'  }).update(' >> ');
            adelante.observe('click', this.avanzar_pagina.bindAsEventListener(this) );
            pie.insert(adelante);
        }
        div.insert(pie);

        this.menu.update( div);

    },

    avanzar_pagina: function( ){
        this.page_index += this.page_limit;
        this.draw_items_list();
    },

    retroceder_pagina: function( ){
        this.page_index -= this.page_limit;
        this.draw_items_list();
    },

    toFormInput: function(formId, inputName){ // puede reescribirse
        var frm = $(formId);
        $$('.'+inputName+'_class').each(function(e){
            e.remove();
        });
        $A(this.lista).findAll(function(c){ return c.asociado == 1 }).each( function (c) {
            frm.insert(new Element('input',{
                className: inputName+'_class',
                name  : inputName,
                value : Object.toJSON({ id: c.id, activo: (c.activa_chk.checked ?1 :0) }),
                type  : 'hidden'
            }));
        });
        return true;

    },

    hide: function(){
        this.menu.hide();
    },

    asociar_item: function(arg){}, //pure virtual

    desasociar_item: function(arg){}, //pure virtual

    empty_body_message: function(){} //pure virual (puede no ser implementada)
});


/** Crea un conrtol con dos combos relacionados. Aparentemente solo utilizado en Encuestas
   @param args
   @param args.options  [
        {
            label : 'parent 1',
            value : 1
            childs : [
                { label : 'child 1', value : 1 },
                { label : 'child 2', value : 2 },
                ...
            ]
        },
        ...
    ]
    @param args.target Elemento que contendra al control
    @param args.name Id base de los elementos del control.
 * @class
 */
Educativa.LinkedCombos = Class.create(
/** @lends Educativa.LinkedCombos# */
{
    /** @private */
    initialize : function (args) {
        this.name = args.name;
        this.options = args.options;
        this.target = args.target;
        Object.extend(this, args);

        this.render();
        this.onChangeParent();
    },
    render : function () {
        $(this.target).update('');

        this.parentCombo = new Element('select', {id : this.name + '_parent'});

        var pcombo = this.parentCombo;
        var options = this.options;

        var i = 0;
        $A(options).each(function(opt) {
            pcombo.insert( new Element('option', {value : opt.value}).update(opt.label) );
        });

        Event.observe(pcombo,'change',this.onChangeParent.bindAsEventListener(this));

        $(this.target).insert(new Element('p').update(
            new Element('label', {'for' : this.name + '_parent'}).update(this.label_parent)
            ).insert(pcombo)
        );
        $(this.target).insert(new Element('p', {id : this.name + '_child_cont'}).update(
            new Element('label', {'for' : this.name + '_child'}).update(this.label_child)
            )
        );
        $(this.target).insert(new Element('input', {type: 'hidden', name: this.name, id: this.name}));

        this.onChangeParent();
    },
    onChangeParent : function() {
        if (this.childCombo) {
            Element.remove(this.childCombo);
        }
        this.childCombo = new Element('select', {id : this.name + '_child'});
        var ccombo = this.childCombo;
        var pcombo = this.parentCombo;

        var options = this.options;

        $A(options).each(function(opt) {
            if (opt.value == pcombo.getValue()) {
                $A(opt.childs).each(function(chld) {
                    ccombo.insert( new Element('option', {value : chld.value}).update(chld.label) );
                });

            }
        });

        this.setValue(pcombo.getValue(),ccombo.getValue());

        Event.observe(ccombo,'change',this.onChangeChild.bindAsEventListener(this));
        $(this.name + '_child_cont').insert(ccombo);
    },
    onChangeChild : function() {
        var ccombo = this.childCombo;
        var pcombo = this.parentCombo;

        this.setValue(pcombo.getValue(),ccombo.getValue());
    },
    setValue : function (p, c) {
        $(this.name).setValue(p + ',' + c);
    },
    getSelected : function () {
        var ccombo = this.childCombo;
        var pcombo = this.parentCombo;
        return [pcombo.getValue(),ccombo.getValue()];
    }
});

/** Crea objetos HTML.
 *  Se creo a partir de un bug de IE, el cual no toma los checked si no estan agregados al form en el DOM.
 *  Debe utilizarse para crear los inputs de tipo check y radio
 *  @function
 */
function ie_bug_element(e,h){
    var parameters = '';
    $H(h).each(function(pair) {
        if( pair.value == null ) return;
        if( pair.key == 'disabled'){
            if(pair.value) {
                parameters += ' disabled="disabled" ';
            }
            return;
        }
        parameters += ' '+pair.key +'="'+ pair.value+'" ';

    });
    return '<'+e+parameters+' />';
}


(function(){

var inputs_creados = [];
/**
    Permite eliminar el contenido de un input file.
    Modo de uso, ejemplo:
    @example
&lt;input id="wImagenPost" class=CajaABM TYPE=FILE NAME="wImagenPost" SIZE=35
       onchange="Educativa.InputClear.agregarInput('wImagenPost')"
       style="width: auto;"
&gt;
    @class
*/
Educativa.InputClear = Class.create(
/** @lends Educativa.InputClear# */
{
    initialize : function(input_id) {
        var input_file = $(input_id);

        this.elementId = input_id;

        this.element = input_file;

        this.element.addClassName('inputFile');

        this.padre = input_file.parentNode || input_file.parentElement;
        this.existeEliminar = 0;
    },

    crear: function(){

        if( this.existeEliminar == 0 ){
            this.wrapper = this.element.wrap( 'div', {className : 'inputClearWrapper'});

            this.wrapper.appendChild( (new Element('a', {
                href : 'javascript:;',
                className : 'inputClearButton',
                title : Educativa.Dict.translate('QUITAR_ARCHIVO')
            })).observe('click', function(){ this.eliminar(); }.bind(this)) );

            this.wrapper.appendChild( new Element('div', { style : 'clear:both' } ) );

            this.existeEliminar = 1;
        }

    },

    eliminar: function(){
        var c = this.element.E();

        this.element = new Element('input', {
            type: 'file',
            className: this.element.className,
            name: this.element.name,
            size: this.element.size,
            id: this.elementId
        });

        if ( c ) {
            c.element = this.element;
        }

        this.element.observe( 'change', this.crear.bind(this) );


        this.wrapper.replace( this.element );

        Educativa.Utils.disable_input_file_keypress();

        this.existeEliminar = 0;
    }

});

Educativa.InputClear.agregarInput = function(input_id) {
    if( ! inputs_creados[input_id] ){
        inputs_creados[input_id] = new Educativa.InputClear(input_id);
    }
    inputs_creados[input_id].crear();
};

Educativa.InputClear.clear = function( input_id ) {
    if( inputs_creados[input_id] ){
        inputs_creados[input_id].eliminar();
    }
};

})();


/**
  Sirve para armar controles desplegables.
  Debe llamarse en el onLoad, o cuando esten creados los objetos
  @param header_id id u objeto que se desplegara al se clickeado
  @param body_id   ud u objeto que sera desplegado
  @param options
  @param {Bool} [options.desplegado='false'] Indica si debe mostrarse desplegado.
  @class
 */
Educativa.Desplegable = Class.create({
    desplegado: false,

    initialize : function( header_id, body_id, options ) {

        Object.extend( this, options );
        this.header = $(header_id);
        this.body   = $(body_id);

        if( this.desplegado ){
            this.header.addClassName('formSection-desplegado');
            this.header.removeClassName('formSection-replegado');
            this.body.show();
        }else{
            this.header.removeClassName('formSection-desplegado');
            this.header.addClassName('formSection-replegado');
            this.body.hide();
        }

        this.header.observe('click',this.onClick.bindAsEventListener(this));
    },

    onClick: function(){
        if( this.desplegado ){
            this.desplegado = false;
            this.header.removeClassName('formSection-desplegado');
            this.header.addClassName('formSection-replegado');
            this.body.hide();
        }else{
            this.desplegado = true;
            this.header.addClassName('formSection-desplegado');
            this.header.removeClassName('formSection-replegado');
            this.body.show();
        }
    }
});

/** Genera un spiner sobre el elemento deseado, bloqueando al mismo.
    @param options
    @param options.over Elemento sobre el cual se creara el spinner
    @param [options.transparent='true'] indica si el mismo se mostrara con trasnparencia
    @param [options.className='OverlayedSpinner'] Clase del elemento
    @param [options.opacity='0.6']
    @param [options.over_opacity='0.8']
 * @class */
Educativa.OverlayedSpinner = Class.create(
/** @lends Educativa.OverlayedSpinner# */
{
    over: null,
    spinner: null,
    className: 'OverlayedSpinner',
    transparent: true,
    opacity: 0.6,
    over_opacity: 0.8,

    initialize: function(args){
        Object.extend( this, args);

        var d = this.over.getDimensions();
        this.spinner = new Element('div',{ className: this.className +'-spinner' } );
        this.spinner.setStyle({
            position: 'absolute', width: d.width, height: d.height, zIndex: 1000
        });
        this.spinner.clonePosition(this.over);
        this.spinner.setOpacity(this.opacity);
        if( this.transparent ) this.over.setOpacity(this.over_opacity);
        $(document.body).insert( this.spinner );
        this.showing = true;

    },
    remove: function(){
        this.spinner.remove();
        if( this.transparent ) this.over.setOpacity(1);
        this.showing = false;
    }

});

/**
    Objeto que representa un campo de la clase {@link Educativa.FormSimple}.<br/>
    En caso de que se trate de un campo 'custom', se puede agregar todo el numero de parametros que sea necesario.
    @name FormField
    @class
    @param options
    @param options.name Id del campo
    @param options.label Label de campo, en caso de que pase '' el label no se mostrara.
    @param options.type  Tipo de campo que sera creado.<br/>Actualmente soporta los siguientes tipos:
                         'text', 'hidden', 'check', 'datetime', 'richtext', 'numeric', 'custom', 'new_password',
                         'combo', 'label', 'radiogroup'
    @param options.value Valor que tendra inicialmente el control.
    @param [options.force_name] Pisa el parametro name, y se utiliza como name del campo, sin importar el id de la clase.
    @param [options.tooltip] Tooltip del control.
    @param [options.classes] Listado de clases css que se agregaran al elemento.
    @param [options.readonly='false'] Indica si el elemento podra ser editado, o sera de solo lectura.
    @param [options.obligatorio='false'] Indica si el elemento es obligatorio.
    @param [options.maxlength] Se utiliza para especificar el maximo permitido para los input de texto.
    @param [options.items] Se utiliza junto al tipo 'combo', es un array ({value: , name: }) con los elementos del combo.
    @param [options.render] Se utiliza para el tipo 'custom'. Funcion encargada de dibujar el control.
                            Toma como parametro el elemento line donde debe dibujarse, y el objeto con la definicion.
    @param [options.reset]  Se utiliza para el tipo 'custom'. Funcion encargada de resetear el control.
    @param [options.submit_value] Se utiliza para el tipo 'custom'. Funcion encargada de devolver el valor del control.
    @param [options.validar] En caso de que se pase una funcion, que toma como primer parametro, el formulario, y como
                             segundo, el objeto a validar, se invoca la misma para validar el elemento en la funcion
                             {@link Educativa.FormSimple#validate}. Deve devolver true o false.

*/

/** Modulo para generar formularios.<br/>
    Es el modulo que debe utilizarse a la hora de crear formularios web. El mismo puede utilizarse direcctamente
    ser heredado por otra clase que extienda sus funcionalidades.

    @param {Object} option Objeto con las opciones para inicializar la clase.
    @param {Element} option.container Elemento que contendra al formulario.
    @param {String} [option.method='']
    @param {String} [option.action='']
    @param {String} [option.id='event_form']
    @param {String} [option.className ='EventForm']
    @param {String} [option.submit_button_text='Agregar']
    @param {String} [option.cancel_button_text='Cancelar']
    @param {Bool} [option.cancel_button=true]
    @param {Bool} [option.submit_button=true]
    @param {Bool} [option.submit_on_key_return=false]
    @param {function} [option.on_submit_hd=null]
    @param {function} [option.on_cancel_hd=null]
    @param {FormField[]} fields Array con la especificacion de los campos que contendra el formulario

    @example
    // Campos del formulario
 var form_fields = [
     {
         name: 'categoria',
         label: 'CATEGORIA'.term().capitalize(),
         type: 'combo',
         value: this.secuencia.categoria || '',
         obligatorio: 1,
         items: this.categorias,
         tooltip: 'TOOLTIP_AULA_CATEGORIA_SECUENCIA'.term(),
         classes: 'selectSimple',
         readonly: !this.editable()
     },{
         name: 'nombre',
         label: 'NOMBRE'.term().capitalize(),
         type: 'text',
         value: this.secuencia.nombre || '',
         obligatorio: 1,
         maxlength: 50,
         tooltip: 'TOOLTIP_AULA_NOMBRE_SECUENCIA'.term(),
         classes: 'inputTextMediano',
         readonly: !this.editable()
     },{ // Campo costumizable
         name: 'pildoras',
         label: '',
         type: 'custom',
         value: this.secuencia.pildoras,
         render: this.pildoras_control_render,//function handler
         reset: this.pildoras_control_reset, //function handler
         submit_value: this.pildoras_control_value, //function handler
     }
 ];
 //Inicializamos la clase
 this.form = new Educativa.FormSimple({
       container: $(this.container),
       id : 'SecuenciaForm-',
       className: 'SecuenciaForm',
       submit_button: false,
       cancel_button: false
     },
     form_fields
 );

  @class
*/
Educativa.FormSimple =  Class.create(
/** @lends Educativa.FormSimple# */
{
    id: 'event_form',
    className : 'EventForm',
    submit_button_text: 'Agregar',
    cancel_button_text: 'Cancelar',
    cancel_button: true,
    submit_button: true,
    submit_on_key_return: false,
    on_submit_hd: null,
    on_cancel_hd: null,

    /** @ignore */
    initialize : function( options, elements) {

        Object.extend( this, options);

        this.elements = $A(elements);

        this.toHTML();
    },

    /** @private */
    toHTML: function(){
        this.form = new Element('form',{ id: this.id, className: this.className });

        if( this.method ) this.setMethod( this.method );
        if( this.action ) this.setAction( this.action );

        this.container.insert( this.form );
        this.elements.each( this.add_element.bind(this) );

        this.form.insert(
            this.btns_fr = new Element('div', { className: this.className+'-Buttons' })
        );
        if( this.cancel_button ){
            this.btns_fr.insert( this.cancel_b = new Element('input', {type: 'button', value: this.cancel_button_text}) );
        }
        if( this.submit_button ){
            this.btns_fr.insert( this.submit_b = new Element('input', {type: 'button', value: this.submit_button_text }) );
        }

        if( this.on_cancel_hd ){ this.cancel_b.observe('click', this.on_cancel_hd.bind(this) ); }
        if( this.on_submit_hd ){ this.submit_b.observe('click', this.submit.bind(this) ); }

    },

    /** Agrega campos al formulario. Utilizada mas que nada de forma interna */
    add_element: function( obj ){

        var element_name = obj.force_name || this.id+obj.name;
        var element_id   = this.id+obj.name;

        if(  obj.type == 'hidden' ){
            this.form.insert(
                obj.element = new Element('input', { id: element_id, name: element_name,
                                                     value: obj.value, type: 'hidden' })
            );
            return;
        }

        var line = obj.line = new Element('div', { className: this.className + '-line' });

        if( obj.label ){
            var clase_label =   this.className+'-Label-'+obj.type+' '
                              + this.className + (obj.obligatorio ? "-requerido" : "-opcional");
            var label = obj.label_obj = new Element('label', { className: clase_label } )
                                        .update( obj.label )
            line.insert( label );

            if( obj.tooltip ){
                var tt = new Element('a', { className: this.className + '-tooltip-button' } );
                label.insert( tt );
                new Educativa.Tooltip({
                    trigger : tt,
                    html    : obj.tooltip,
                    canFixed: true
                }).hide();
            }
        }

        this.form.insert( line );
        obj.readonly = obj.readonly ? true : false;
        var element_classes = ( obj['classes'] ? obj['classes']+' ' : '' ) +  this.className;

        if(       obj.type == 'text' ){
            line.insert(
                obj.element = new Element('input', { id: element_id, name: element_name, disabled: obj.readonly,
                                                     className: element_classes+'-Text', value: obj.value,
                                                     maxlength: obj.maxlength, type: 'text' })
            );
            obj.element.observe( 'keydown', this.onInputKeyDown.bindAsEventListener(this, obj));
        }else if( obj.type == 'check' ){
            line.insert( ie_bug_element( 'input', { type: 'checkbox' ,id: element_id, name: element_name,
                                                    'class': element_classes+'-check', value: obj.value || obj.name,
                                                    disabled: obj.readonly
                                                  })
            );
            obj.element = $(element_id);
            obj.element.checked = obj.checked ? 'checked' : '';
        } else if( obj.type == 'radiogroup' ) {
          var container = new Element('ul', { id : element_id + '-' + element_name, 'class' : 'radiogroup' });
          obj.options.each( function(e) {
            var opt_line = new Element('li', { 'class' : 'radiogroup-line' });
            var radio_params = {
                type     : 'radio',
                id       : element_id + '-' + e.value,
                name     : element_name,
                'class'  : element_classes + '-radio',
                value    : obj.name + '-' + e.value,
                disabled : obj.readonly
            };
            if( e.value == obj.default_checked ) Object.extend( radio_params, { checked : 'checked' } );
            var radio = ie_bug_element( 'input', radio_params );
            opt_line.insert( radio );
            var label = new Element('label').update( e.label );
            opt_line.insert( label );
            container.insert( opt_line );
          });
          line.insert( container );
          obj.element = $(element_id);
        }else if( obj.type == 'datetime' ){
            this.datetime_input( line, obj );
        }else if( obj.type == 'richtext' ){
            line.insert( obj.element = new Element('textarea', { id: element_id, name: element_name,
                                                                 disabled: obj.readonly})
            );
            try { obj.element.setValue( obj.value ) }catch(e){}; //IE7 hack.
        }else if( obj.type == 'numeric' ){
            line.insert( obj.element = new Element('input', { id: element_id, name: element_name ,
                                                              value: obj.value, className: element_classes+'-Numeric',
                                                              disabled: obj.readonly })
            );
            obj.element.observe( 'keydown', this.onInputKeyDown.bindAsEventListener(this, obj));
        }else if( obj.type == 'custom' ){
            obj.render.bind(this, line, obj)();

        }else if( obj.type == 'new_password' ){
            line.insert(
                obj.element = new Element('input', { type: 'password', autocomplete: 'off', id: element_id,
                                                     name: element_name, disabled: obj.readonly,
                                                     className: element_classes+'-Text', value: obj.value })
            );

        }else if( obj.type == 'combo' ){
            line.insert(
                obj.element = new Element( 'select',{ id: element_id, name: element_name, disabled: obj.readonly,
                                                     className: element_classes+'-Combo'  })
            );
            obj.items.each( function(h) {
                 obj.element.insert(new Element('option', { value : h.value }).update(h.name) );
            }, this );
            obj.element.setValue( obj.value );

        }else if( obj.type == 'label' ){
            line.insert(
                obj.element = new Element('label', { id: element_id, className: element_classes+'-Label'})
                                  .update(obj.value)
            );
        }
        else{
            alert('Error: bad type "'+obj.type+'"')
        }

        if( ! obj.disable ){
            /** @ignore */
            obj.disable = function(){ obj.element.disable(); };
        }

        return obj;
    },

    /** @private */
    datetime_input: function( line, obj ) {
        var ro_class = obj.readonly ? ' date_disabled' : '';
        line.insert( obj.element = new Element('input',{
            id : this.id+obj.name,
            type:'text',
            value: Educativa.Utils.dateFormat(obj.value) || '',
            className: this.className+'-dateInput' + ro_class,
            readonly: 'readonly',
            disabled: obj.readonly
        }));

        /** @ignore */
        obj.disable = function(){ obj.element.disable(); obj.element.addClassName('date_disabled'); };

        obj.date = obj.value;
        var myself = this;

        Calendar.setup({
            inputField     : this.id+obj.name,
            ifFormat       : "%d/%m/%Y %H:%M",
            step           : 1,
            showsTime      : 1,
            timeFormat     : '24',
            //onClose        : function(cal){ cal.destroy(); }, //genera problemas en IE
            onUpdate       : function(cal){
                if( obj.onUpdate ) obj.onUpdate.bind(myself, cal, obj)()
                else obj.date = cal.date;
            },
            date           : obj.value
        });

    },

    /** Resetea el formulario */
    reset: function(){
        this.elements.each( function(e){
            if(      e.type == "check"    ){ e.element.checked = e.checked ? 'checked' : ''; }
            else if( e.type == "datetime" ){ e.element.value = Educativa.Utils.dateFormat(e.value); }
            else if( e.type == "slider"   ){                               }
            else if( e.type == "custom"   ){ e.reset ? e.reset(e) : '';    }
            else if( e.element['value']   ){ e.element.value = e.value;    }
            else                           { e.element.inneHTML = e.value; }
        });
    },

    /** Devuelve los valores del formulario
        @return Devuelve un Hash con los pares { name: value } de cada uno de los campos. */
    getValues: function(){
        var values = {};
        this.getElements().each( function(e){
            values[e.name] = this.getValue(e);
        }, this );
        return values;
    },

    getValue: function( element_or_name ){
        var e = Object.isString(element_or_name) ? this.getElement( element_or_name) : element_or_name;
        if(      e.type == "check"  ){ return e.element['checked'] ? 1 : 0;  }
        else if (e.type == "custom" ){ return e.submit_value(e); }
        else if( e.element['value'] ){ return e.element.value || '';    }
        else                         { return e.element.inneHTML || ''; }
    },

    /** Hace focus al primer elemento del formulario */
    focus: function(){
        this.elements.first().element.focus();
    },

    /** Devuelve el objeto que representa el campo "name"  del formulario */
    getElement: function( name ){
        return this.elements.find(function(e){ return e.name == name });
    },

    /** Devuelve el array con los campos del formulario */
    getElements: function(){
        return this.elements;
    },

    /** Setea el texto del boton de submit, en caso de que tenga uno */
    setSubmitButtonText: function(text){
        this.submit_b.value = text;
    },

    /** Setea el method del form: (POST|GET) */
    setMethod: function( method){
        this.form.method = method;

        if ( method.toLowerCase() == 'post' ) {
          this.form.setAttribute('enctype','multipart/form-data');
        }
    },

    /** Setea el action del form */
    setAction: function( action){
        this.form.action= action;
    },

    /** Devuelve el elemento form interno de la clase. Lo mejor seria no tener que utilizar este metodo. */
    getFormElement: function(){
        return this.form;
    },

    /**
     * Esta funcion maneja los eventos key down en los inputs de tipo text. Puede ser reescrita.
     * Por defecto, si esta activada la variable submit_on_key_return, ejecuta la funcion
     * on_submit_hd si esta definida, o hace en caso contrario hace un submit del form.
    */
    onInputKeyDown: function (e) {
        if (e.keyCode == Event.KEY_RETURN && this.submit_on_key_return ){
            Event.stop(e);
            this.submit();
        }
    },

    /** Esta funcion se invoca al llamar la funcion {@link #submit}. Solo se validan los campos que tiene el parametro
     * validar con una funcion asignada. Ademas setea un array con los elementos invalidos, consultable
     * via {@link #getInvalidElements}.
     * Puede ser reimplementada para personalizar la validacion.
     * @return {Bool} true en caso de que sea valido o false en caso contrario.
    */
    validate: function(){
        this.invalid_elements = $A();

        this.getElements().each( function(el) {
            if( el.line) el.line.removeClassName('invalid');
            if( el.validar ){
                if( ! el.validar(this, el) ){
                    if( el.line ) el.line.addClassName('invalid') ;
                    this.invalid_elements.push(el);
                    valido = false;
                }
            }
        }, this );

        if( this.invalid_elements.size() ){
            var first = this.invalid_elements.first();
            if( first.element.focus ) first.element.focus();
            return false;
        }

        return true;
    },

    /** Retorna un array con los elementos invalidos luego de invocar a {@link #validate}. */
    getInvalidElements: function(){ return this.invalid_elements || [] },

    /** Realizar un submit del form, en caso de que la funcion {@link #validate} devuelva true.
     * En caso de que este definido el parametro {@link #on_submit_hd}, llama a este metodo y nada mas, por
     * backward compatibility.
     */
    submit: function(){
        if( this.on_submit_hd ) return this.on_submit_hd();

        if( this.validate() ) return this.getFormElement().submit();
    }

});

Educativa.HTMLUpload = Class.create(
/** @lends Educativa.HTMLUpload.prototype */
{
    /**
     Modulo para subir archivos utilizando HTML puro.
     Esta clase es utilizada por {@link Educativa.Aula.Upload}
     @param settings utiliza el mismo juego de seteos que SWFUload
     @constructs
    */
    initialize: function( settings ){
        this.settings = settings;
        this.id_upload = 0;
        $(this.settings.button_placeholder_id).update(
            this.btn_upload = new Element('a', {className: 'inputSubmit'}).update(
                this.settings.term_desdemipc || 'RECURSOS_DESDE_MI_PC'.term()
            )
        );
        this.btn_upload.observe('click', this.onClickBtnUpload.bindAsEventListener(this));
        this.html_iframe = url_dir + "/templates/upload.html?id="+this.settings.instancia;

        Educativa.HTMLUpload.instancias[this.settings.instancia] = this;

    },

    onClickBtnUpload: function(){
        if( !this.canUploadMoreFiles() ){ return; }
        // pop up para subir archivos
        if( ! this.popup ){
            this.popup = new Educativa.Tooltip.Menu({
                over      : this.btn_upload,
                center    : this.settings.center_file_popup,
                html      : '',
                className : 'UploadPopup',
                offsetLeft: -4,
                offsetTop : 0,
                draggable : true,
                title     : this.settings.term_subirarchivo || 'SUBIR_ARCHIVO'.termcap()
            });
        }

        this.popup.container.update(
            new Element('iframe', { id: 'upload_iframe', src: this.html_iframe })
        );
        this.popup.raise_dialog();

        var cumulativeOffset = this.btn_upload.cumulativeOffset();
        this.popup.element.setStyle({ top: ( cumulativeOffset.top - 4) + "px", left:( cumulativeOffset.left ) + "px"} );

        this.settings.file_dialog_start_handler &&  this.settings.file_dialog_start_handler();
    },

    // valida si se puede seguir subiendo archivos (si no se llego al limite)
    canUploadMoreFiles: function(){
        if( this.settings.button_disabled ) return false;

        if( ! this.settings.file_upload_limit ) return true;

        var cant_archivos = this.settings.stats.successful_uploads + this.settings.cant_adjuntos_previos;
        return cant_archivos < this.settings.file_upload_limit;
    },

    uploaded: function(filename, url_icono, size, filename_real){
        this.settings.stats.successful_uploads++;
        this.popup.hide();

        // este 'file' lo genera el flash
        var file = {
            id : this.id_upload++,              // SWFUpload file id, used for starting or cancelling and upload
            name : filename,                    // The file name. The path is not included.
            size : size,                        // The file size in bytes
            filestatus : -4                     // The file's current status. Use SWFUpload.FILE_STATUS to interpret the value.
        }

        this.settings.upload_success_handler(file, [filename, url_icono, size, filename_real].join('|'));
        this.settings.upload_complete_handler(file);
    },

    getStats: function(){
        return this.settings.stats;
    },

    setStats: function(stats) {
        this.settings.stats = stats;
        if (this.settings.file_upload_limit) {
            if (this.settings.stats.successful_uploads < this.settings.file_upload_limit) {
                this.btn_upload.removeClassName('inputSubmitDeshabilitado');
                this.settings.button_disabled = false;
            }
        }
    },

    setButtonDisabled: function(isDisabled) {
        this.settings.button_disabled = isDisabled;
        if (isDisabled) this.btn_upload.addClassName('inputSubmitDeshabilitado');
    },

    setFileUploadLimit: function(fileUploadLimit) {
        this.settings.file_upload_limit = fileUploadLimit;
    },

    mssgNoFile: function(){
        return this.settings.error_no_file || 'POR_FAVOR_INGRESA_EL_ARCHIVO'.termcap();
    },

    mssgFileSizeError: function(){
        return 'TAMANO_FICHERO_INVALIDO'.termcap();
    },

    startUpload: function(){
        if( swfu.getStats().successful_uploads == swfu.settings.file_upload_limit ){
            swfu.setButtonDisabled(true);
        }
    },

    hideButton: function(){
        this.btn_upload.hide();
    },

    showButton: function(){
        this.btn_upload.show();
    },

    closeWindow: function(){
        this.popup.hide();
    }

});

Educativa.HTMLUpload.instancias = [];

/**
 * Retorna la instancia solicitada de la clase {@link Educativa.HTMLUpload}
 * @memberOf Educativa.HTMLUpload */
Educativa.HTMLUpload.GetInstancia = function(id){
    return Educativa.HTMLUpload.instancias[id];
};

/**
   Este namespace agrupa los modulos encargados de manejar varios tipo de vistas utilizadas en la plataforma.
   @namespace */
Educativa.View = {};


Educativa.Tab = Class.create({
    initialize: function(args) {
        Object.extend(this, args);

        this.tab = $(this.name+'_span');
        this.content = $(this.name);

        this.tab.observe( 'click', this.on_click.bindAsEventListener(this) );
    },
    on_click: function(e) {
        if(this.onClick) this.onClick(this.name);
    },
    is_selected: function() {
        return this.tab.hasClassName('selected');
    },
    show: function() {
        this.tab.addClassName('selected');
        this.content.show();
    },
    hide: function() {
        this.tab.removeClassName('selected');
        this.content.hide();
    }
});

Educativa.TabController = Class.create({
    initialize: function(tabs) {
        this.tabs = new Object();
        tabs.each(function(tab_name){
            this.tabs[tab_name] = new Educativa.Tab({
                name: tab_name,
                onClick: this.change_tab.bind(this)
            });
        }, this);
        this.selected = this.get_tab( tabs[0] );
        this.placeholder = Educativa.placeholder;
    },
    get_tab: function(tab_name) {
        return this.tabs[tab_name];
    },
    change_tab: function(tab_name) {
        var new_tab = this.get_tab(tab_name);
        if( tab_name != this.selected.name  ){

            this.selected.hide();
            new_tab.show();
            this.selected = new_tab;

            this.hide_placeholder(tab_name);
        }
    },
    hide_placeholder: function(tab_name){
        if ( !this.placeholder ){ return };
        if( tab_name == this.placeholder.get_tab_name() ){
            this.placeholder.show();
        } else {
            this.placeholder.hide();
        }
    }
});

Educativa.Placeholder = Class.create({
    initialize: function(args) {
        Object.extend(this,args);

        this.placeholder = new Element('span', {
            id:        'clave_placeholder',
            className: 'clave_placeholder',
            style:     'position: absolute;'
        }).insert( this.term );

        this.over.insert({ 'before': this.placeholder });

        this.placeholder.observe( 'click', this.on_focus.bindAsEventListener(this) );
        this.over.observe( 'keyup', this.on_keyup.bindAsEventListener(this) );

    },
    show: function() {
        if( this.placeholder && this.over.value == "" ){
            this.placeholder.show();
        }
    },
    hide: function() {
        if( this.placeholder ){
            this.placeholder.hide();
        }
    },
    on_focus: function (e) {
        this.over.focus();
    },
    on_keyup: function (e) {
        if( this.over.value == "" ){
            this.placeholder.show();
            if( this.on_show ) this.on_show();
        } else {
            this.placeholder.hide();
            if( this.on_hide ) this.on_hide();
        }
    },
    get_tab_name: function () {
      return this.tab_name;
    }
});


/**********************************************************
*     ^^^^^^^^^^^^^^^      ^^^^^^     ^^^^^^^^^^^^^^^     *
*     |||||||||||||||      ||||||     |||||||||||||||     *
*                                                         *
*   AGREGAR LAS NUEVAS CLASES ARRIBA DE ESTE COMENTARIO   *
*                                                         *
***********************************************************/

/* muestra / oculta select para el acceso a la Administracion General
   y a la administracion del producto */
Event.observe(window,'load',function(){

    if( $('select_administracion') != null ) {

        var position_top = - ($('select_administracion_opciones').getHeight() + 4) + 'px';

        var toggle = function(event){
            if ( event.isRightClick() ) return;

            $('select_administracion_opciones').setStyle({top: position_top});
            $('select_administracion_opciones').toggle();
        };

        $('select_administracion')
            .observe('mouseup',toggle);

        Event.observe(document.body, 'click', function(event) {


            var element = Event.element(event);

            if(     element.id != 'select_administracion'
                &&  element.id != 'titulo_opciones_administracion')
            {
                $('select_administracion_opciones').hide();
            }
        });

    }
});

// esta funcion ejecuta el codigo en el onload si la pagina aun no se cargo, si la pagina
// esta cargada, la ejecuta direactamente
// Utilizado solo en Educativa/Control/Form.js, posiblemente no sea estrictamente necesario.
// !!!NO UTILIZAR!!! (la idea es eliminarlo ni bien sea posible)
(function(){
    /** @ignore */
    window.$ready = function( fn ){
        Event.observe(window, 'load', fn);
    }

    Event.observe(window, 'load', function(){
        /** @ignore */
        window.$ready = function(fn){
            fn();
        }
    });
})();




/**
* Metodos agregados para el manejo de opciones en los select (no imitar). El elemento select esta definido en el DOM.
* @name select
* @class
*/

Element.addMethods('select',
{
    /**
    *  Elimina todas las opciones de un select
    *  @memberOf select#
    */
    clear : function(element){
            while (element.length> 0) {
                element.remove(0);
            }
        },
    /**
    *  Agrega opciones a un elemento select
    *  @param element SELECT
    *  @param list Array de objetos con las propiedades label y value
    *  @memberOf select#
    */
    add_options : function(element, list){
        list.each(function(i){
            element.appendChild(new Element('option', {value : i.value}).update(i.label) );
        });
    },

    /** mueve los elementos seleccionados a otra lista
        @memberOf select# */
    moveSelectedItemsTo : function(element,hasta) {
        element.select('option')
            .findAll(function(o){return ! o.disabled && o.selected})
            .invoke('remove')
            .each(function(e){ $(hasta).appendChild( e ) });
        element.sortItems();
    },
    /** ordena los elementos del select de forma ascendente
       @memberOf select# */
    sortItems : function(element){
        element.select('option')
            .invoke('remove').sort(function(a,b){
                return a.innerHTML.localeCompare( b.innerHTML );
            })
            .each(function(e){ element.appendChild( e ) });
    },
    /** selecciona todos los elementos del select
       @memberOf select# */
    selectAllItems : function(element) {
        if(! (element.multiple && element.multiple) ) return ;
        element.select('option').each(function(o){o.selected = true});
    }
});

/*Esto falla en ciertos entornos */
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
    return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
    return this.replace(/\s+$/,"");
}


/****************************************************************************************************
*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*
*!!!! Las ultimas funciones pueden fallar en ciertos navegadores (es un comportamiento esperado) !!!*
*!!!! AGREGAR LAS NUEVAS CLASES ANTES DEL ULTIMO Event.observe                                   !!!*
*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*
*****************************************************************************************************/

