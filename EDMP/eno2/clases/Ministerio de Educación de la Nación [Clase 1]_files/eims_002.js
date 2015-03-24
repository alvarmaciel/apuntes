/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/

/*******************************************
 * ******** Callbacks Eventos Eims ******* *
 *******************************************/

Educativa.EimsNotificationsListener = (function(){
    var suscribers = new Hash();
    return {
        suscribe : function( notification, callback ) {
            if( Object.isUndefined( suscribers.get( notification ) ) )
                 suscribers.set(notification, new Array());
            suscribers.get( notification ).push( callback );
        },
        notify : function( notification, user, data ) {
            if( Object.isUndefined( suscribers.get( notification ) ) )
                return;
            var list = suscribers.get( notification );
            for( i = 0; i < list.length; i++ ) {
                list[i]( this, user, data );
            }
        }

    };
})

Educativa.EimsNotificationsListener.getInstance = function() {
    var _instance = new Educativa.EimsNotificationsListener();
    Educativa.EimsNotificationsListener.getInstance = function(){ return _instance };
    return _instance;
}


// EIMS
var eims = null;
var dsalt = null;
var rest_url = null;

function EIMS_onLogOffSuccess(){
    Educativa.Eims.GetInstance().connected(false);
    eims.setReady(false);
}

// Global functions required by EIMS.
function EIMS_onConnectionSuccess() {
    eims = new EIMSCore($('eims2'));

    eims.setReady(true);

    dsalt = Educativa.Aula.Session.dsalt;
    rest_url = dsalt.autenticado == 0 ? Educativa.Aula.Config.rest_url : "";

    // Try to get the list of users.
    eims.getUserList();

    // Try to get messages on queue.
    eims.getQueuedMessages();

    Educativa.Eims.GetInstance().connected(true);
}

function EIMS_onPrivateMessageFailed( mssg , to ) {

    var chat_control = eval("Educativa.Eims.GetInstance()._chat._object."+to+".chatControl");

    var mensaje_error = Educativa.Dict.translate('EIMS_ERROR_AL_ENVIAR_MENSAJE').capitalize();

    chat_control.printMessage('eims_chat_messages', '<span class="eims_error">' + mensaje_error +  '"' + mssg.evalJSON().text + '"</span>', true);

}

function EIMS_onConnectionFailed() {
    Educativa.Eims.GetInstance().connected(false);
    eims = new EIMSCore($('eims2'));
    eims.setReady(false);
}

function  EIMS_onGetUserList(userList) {
    Educativa.Eims.GetInstance().setUserList( userList );
}

function EIMS_onGetQueuedMessages(messages) {
    messages.each(function (item, index) {
        EIMS_onMessage(item.from, item.message);
    });
}

function EIMS_onUserJoin(user) {
    Educativa.Eims.GetInstance().addUser( user );
}

function EIMS_onUserLeave(user) {
    /*removeSelectOption($('cboUserList'), user.nickname);*/
    Educativa.Eims.GetInstance().removeUser( user );
}

function EIMS_onMessage(from, message) {

    var json = message.evalJSON();
    if ( json.notification ) {
        switch( json.notification.type ) {
            case 'NewEmail':
                if (Educativa.Aula.Group.webmail)
                    new Educativa.Eims.EmailPopup( json.user );
                break;
            case 'ChatInvitation':
                new Educativa.Eims.ChatInvitationPopup(json.user);
                break;
            default:
                Educativa.EimsNotificationsListener
                    .getInstance()
                    .notify( json.notification.type, json.user, json.notification  );

        }
    }
    else {
        Educativa.Eims.GetInstance().openChat( null, json.nickname , message );
    }
}

function EIMS_onGetMessageHistory(to, messages) {

    var chat = Educativa.Eims.GetInstance().openChat( null, to );
    chat.getChat().setHistory(messages);

}

/*******************************************************
 * ****** Rutina para cargar el Flash de Eims ******** *
 *******************************************************/

function get_flash_vars() {
        var user   = Educativa.Aula.User;
        var group  = Educativa.Aula.Group;
        var config = Educativa.Aula.Config;

        user.eims_config.url_foto = user.url_foto;

        var data = $H({
            IdUsuario          : user.id_usuario,
            NombreUsuario      : user.nombre,
            ApellidoUsuario    : user.apellido,
            URLFotoUsuario     : Object.toJSON(user.eims_config),
            IdiomaUsuario      : user.idioma,
            // utilizo la variable PerfilUsuario para guardar info extra
            //PerfilUsuario      : ,
            NombreSala         : config.id_instalacion + '_' + group.id,
            DescripcionSala    : group.descripcion,
            Servidor           : config.eims_server,
            Aplicacion         : 'eims',
            ChatLogDownloadURL : 'http://localhost/download_chat_log.php',
            SoundURL           : config.url_sounds,
            Salt               : config.eims_salt,
            IdInstalacion      : config.id_instalacion
        });

        return data.toQueryString();
}

var eims_write_flash_ejecutado = 0;
/// Carga el flash de mensajeria
function eims_write_flash(){

        // para evitar que se ejecute mas de una vez
        if( eims_write_flash_ejecutado ) return;

        eims_write_flash_ejecutado = 1;

        // Version check for the Flash Player that has the ability to start Player Product Install (6.0r65)
        var hasProductInstall = DetectFlashVer(6, 0, 65);

        // Version check based upon the values defined in globals
        // Major version of Flash required
        var requiredMajorVersion = 9;
        // Minor version of Flash required
        var requiredMinorVersion = 0;
        // Minor version of Flash required
        var requiredRevision = 28;
        var hasRequestedVersion = DetectFlashVer(requiredMajorVersion, requiredMinorVersion, requiredRevision);

        if ( hasProductInstall && !hasRequestedVersion ) {

            // DO NOT MODIFY THE FOLLOWING FOUR LINES
            // Location visited after installation is complete if installation is required
            var MMPlayerType = (isIE == true) ? "ActiveX" : "PlugIn";
            var MMredirectURL = window.location;
            document.title = document.title.slice(0, 47) + " - Flash Player Installation";
            var MMdoctitle = document.title;

            AC_FL_RunContent(
                "src", Educativa.Aula.Config.url_swf + "eims/playerProductInstall",
                "FlashVars", "MMredirectURL="+MMredirectURL+'&MMplayerType='+MMPlayerType+'&MMdoctitle='+MMdoctitle
                    +"&"+ this.get_flash_vars(),
                "width", "1",
                "height", "1",
                "align", "middle",
                "id", "eims2",
                "quality", "high",
                "bgcolor", "#869ca7",
                "name", "eims2",
                "allowScriptAccess","sameDomain",
                "type", "application/x-shockwave-flash",
                "pluginspage", "http://www.adobe.com/go/getflashplayer"
            );
        } else if (hasRequestedVersion) {
            // if we've detected an acceptable version
            // embed the Flash Content SWF when all tests are passed
            AC_FL_RunContent(
                "src", Educativa.Aula.Config.url_swf + "eims/eims2",
                "FlashVars", this.get_flash_vars(),
                "width", "1",
                "height", "1",
                "align", "middle",
                "id", "eims2",
                "quality", "high",
                "bgcolor", "#869ca7",
                "name", "eims2",
                "allowScriptAccess","sameDomain",
                "type", "application/x-shockwave-flash",
                "pluginspage", "http://www.adobe.com/go/getflashplayer"
            );
        } else {  // flash is too old or we can't detect the plugin
            var alternateContent = 'Alternate HTML content should be placed here. '
            + 'This content requires the Adobe Flash Player. '
            + '<a href=http://www.adobe.com/go/getflash/>Get Flash</a>';
            document.write(alternateContent);  // insert non-flash content
        }
}


/********************************************************
 * ******* ****** Educativa.Eims ********* ************ *
 ********************************************************/

/**
 * @event chatCreate(Educativa.Eims.Chat);
 */
Educativa.Eims = Class.create(Educativa.Observable, {

    initialize : function( args ){
        this._userList = [];
        this._chat = $H();
        this.connected_queue = [];
    },

    render : function( container ){
        ///////////////
        /// Layout ///
        ///////////////
        var layer = new Element('span', { id: "eims_wrapper" })

        //Chat List
        .insert(
            new Element('span', { id: "eims_chat_list" } )

        // Status Bar
        ).insert(
            new Element('span', { id: "eims_status_bar" } )

                .insert( new Element('span', { id: "eims_connecting", className: 'eims_ibox' }) )

                // Icono para cuando el eims no se conecta
                .insert(
                    new Element('a',{ id: "eims_not_connnected", className: 'eims_ibox', style:"display:none"} ).insert(
                           '<span class="eims_tooltip">'
                       +     '<em>'+Educativa.Dict.translate('EIMS_NOT_CONNECTED_TITLE').capitalize()+'</em>'
                       +   '</span>'
                       +   '<span class="eims_not_connnected_icon"></span>'
                    )
                )

                .insert(
                    new Element('span', { id: "eims_menu", className: 'eims_ibox', style: "display:none" }).insert(
                        // Mensaje de status
                        '<a href="#" id="eims_menu_text" ></a>'

                        // Popup con usuarios
                        + '<div class="eims_tab_window" id="eims_tab_window" style="display:none">'
                        +   '<div class="eims_chat_header_div">'
                        +     '<div class="eims_title">'
                        +       '<a href="#" class="eims_btn_min" id="eims_btn_min"></a>'
                        +       '<strong>'+Educativa.Dict.translate('USUARIOS_CONECTADOS').capitalize()
                        +       '</strong>'
                        +     '</div>'
                        +   '</div>'
                        +   '<ul id="eims_user_list" class="eims_userlist"></ul>'
                        + '</div>'
                    )
                )
        );

        container.insert( layer );

        new Educativa.Eims.SetSoundBtn( $('eims_status_bar') );

        this.updateConnectedUsers();

        // Notificaciones
        container.insert( new Element('div', { id: "eims_messages" }) )

        ///////////////
        /// Eventos ///
        ///////////////

        //cualquier click fuera de eims cierra el pop up.
        document.observe('mouseup', function(ev){
            try{
                if( ev.element().ancestors().indexOf( layer ) < 0 ) $('eims_tab_window').hide();
            }catch(e){
                $('eims_tab_window').hide();
            }
        });

        //Cierra y despliega lista de usuarios
        $('eims_btn_min')  .observe( 'click', this.toggle.bindAsEventListener(this) );
        $('eims_menu_text').observe( 'click', this.toggle.bindAsEventListener(this) );

    },

    adjust : function(){ //que hace: aparentemente ajusta la posicion de la barra, sobre todo width y top

        return; // !!! De momento hemos dejado de usar esto !!!!!
        /*
        var of = document.viewport.getScrollOffsets(),
             h = document.viewport.getHeight(),
             w = document.viewport.getWidth();
        w = $('marco_encabezado').getWidth() + 2; //incluye borde
        $( 'eims_wrapper' ).clonePosition(
            $('marco_encabezado'),
            {setTop : false, setHeight : false, setWidth : true}
        );
        $( 'eims_wrapper' ).setStyle({ width: w +'px' });
        if ( Educativa.Browser.isIE6 ) {
            h = document.body.clientHeight;
            $('eims_wrapper').setStyle({top: (h - $( 'eims_wrapper' ).getHeight() + of.top) + 'px' } );
        }else{
            $('eims_wrapper').setStyle({ width: w +'px' });
        }
        */
    },

    onConnected : function(fn){
        if ( this.isConnected ) fn();
        else this.connected_queue.push(fn);
    },

    connected : function(flag){
        if( $('eims_connecting') ) $('eims_connecting').hide();
        if ( flag ){
            this.isConnected = true;
            if( $('eims_menu') ) $('eims_menu').show();
            if( $('eims_sound_btn') ) $('eims_sound_btn').show();
            if( $('eims_not_connnected') ) $('eims_not_connnected').hide();
            this.connected_queue.invoke('call');
        }else{
            if( $('eims_menu') ) $('eims_menu').hide();
            if( $('eims_sound_btn') ) $('eims_sound_btn').hide();
            if( $('eims_not_connnected') ) $('eims_not_connnected').show();
            this.isConnected = false;
        }
    },

    sendNotification : function(to,object)
    {
        // hack, quito las comillas por un error unknown
        // al enviar al server el json con comillas
        var fkUser = $H(Educativa.Aula.User).clone();
        fkUser.set('nombre', fkUser.get('nombre').replace(/\"/g,"") );
        fkUser.set('apellido', fkUser.get('apellido').replace(/\"/g,"") );

        if ( typeof to == 'string' ) to = [to];

        var dsalt = Educativa.Aula.Session.dsalt;
        var rest_url = dsalt.autenticado == 0 ? Educativa.Aula.Config.rest_url : "";

        this.onConnected(
            function(){
                to.each(function(to){
                    eims.privateMessage(
                        to,
                        Object.toJSON({
                            "notification" : object,
                            "user" : fkUser
                        }) ,
                        dsalt.valor ,
                        rest_url
                    );
                });
            }.bind(this)
        );
    },

    ajustarAltoUsers : function() {
        var max = 10, alto_user = 35, alto;
        if(this._userList.length <= max) {
            alto = this._userList.length * alto_user;
        }else alto = max * alto_user;

        $('eims_user_list').setStyle({height : alto + 'px'});
    },

    updateConnectedUsers : function(){

        var msg = '';

        if( ! $('eims_menu_text') ) return;
        if( this._userList.length ){
            msg = Educativa.Dict.translate('N_USUARIOS_CONECTADOS');
            $('eims_menu_text').update(
                msg.interpolate({ n: '<strong>'+this._userList.length+'</strong>' }).capitalize()
            );
        }else{ /* no hay usuarios conectados */
            msg = Educativa.Dict.translate('NO_HAY_USUARIOS_CONECTADOS').capitalize();
            $('eims_menu_text').update( msg );
        }
        this.ajustarAltoUsers();
    },

    toggle : function(ev){
        if ( ev ) ev.stop();
        var el = $('eims_tab_window');
        if ( el.visible() )
            el.hide();
        else
            this.show()
    },

    show : function(){

        this.ajustarAltoUsers();

        this._chat.each(function(e){ e[1].hide() } );
        $('eims_tab_window').show();
    },

    highlightUser : function(nick)
    {
        this.show();
        new Effect.Highlight('eims_userlist_' + nick, { duration:2} )
    },

    setUserList : function(userList)
    {
        // cuando se carga la lista
        userList.each( this._addUser.bind( this ) );

        // tambien levanto la session

        // guarda los id_usuarios separados por | de las conversaciones abiertas
        var opened = Cookie.get( 'eims_chats' ),
            active = Cookie.get( 'eims_active' );

        var isOpen = new RegExp('^' + opened + '$');

        var chat_activo;

        for( var i=0; i<this._userList.length; i++)
        {
            var id_usuario = this._userList[i].nickname;
            if(isOpen.test( id_usuario ))
            {
                var chat = this.openChat( null, id_usuario);
                if( active == id_usuario )
                    chat_activo = chat;
            }
        }

        if ( chat_activo )
            chat_activo.show();

    },

    _addUser: function(user){
        if ( user.nickname == Educativa.Aula.User.id_usuario ) return ;
        this._userList.push( user );

        if ( user.imageURL.isJSON() ) {
            user.eims_config = user.imageURL.evalJSON();
            user.imageURL = user.eims_config.url_foto;
        }

        var li = new Element('li', { id : 'eims_userlist_' + user.nickname } );
        var img_url = user.imageURL.replace('thumb_60x68','thumb_40x45');
        var mini_thumb = new Element('img' , { id: 'thumb_' + user.nickname , src: img_url , className: 'userslist_minithumb'} );
        li.addClassName( 'eims_userlist_item' );

        var c_eims_user_online = new Element('a' , { href: '#' , className: 'eims_user_online' } )
        .insert(
            new Element('span' , { className: 'user_minithumb' } ).insert( mini_thumb )
        )
        .insert(
            new Element('span' , { className: 'user_name' } ).update( user.fullName.escapeHTML() )
        );


        li.insert( c_eims_user_online );

        this.initUserMenu( li, user );

        $('eims_user_list').appendChild(li);
        this.updateConnectedUsers();
    },

    initUserMenu : function(_target, user) {
        var menu = new Educativa.Eims.UserMenu( user)
        _target.insert( menu );

        _target.observe('click', function(ev){ ev.stop(); });
        menu.observe('click', this.on_user_action.bind(this));
    },

    on_user_action : function(sender, cmd) {
        var user = sender.getUser();

        switch( cmd.id ) {
            case 'minichat':
                var chat = this.openChat(false, user.nickname, null, 1);
                chat.show();
                break;
            case 'chat':
                this.sendNotification(user.nickname, {type:'ChatInvitation'});
                break;
            case 'email':
                Educativa.Aula.Control.MailTo({
                    to:user.nickname,
                    nombre:user.fullName,
                    subject:'',
                    message: ''
                });
                break;
            case 'perfil':
                var url = url_dir + 'perfil.cgi?id_usuario=' + user.nickname + '&id_curso=' + Educativa.Aula.Group.id;
                Educativa.Popup.open({url: url, width: 670, height: 450, center: true});
                break;
            case 'videochat':
                $LAB.script('Educativa/Aula/VideoChat.js').wait(function(){
                    Educativa.Aula.VideoChatMediator.getInstance()
                        .sendInvitation(user.nickname);
                });
                break;

        }
    },

    getUsuario:function(nickname)
    {
        for( var i = 0; i < this._userList.length; i++)
            if(this._userList[i].nickname == nickname )
                return this._userList[i];
    },

    openChat : function(ev, nickname, message, mostrar)
    {
        if( ev )
        {
            ev.stop();
        }

        $('eims_tab_window').hide();

        var chat = this._chat.get(nickname);

        // Reproducir sonido si la ventana estaba cerrada y se recibe un msg

        if (! chat )
        {
            var user = this.getUsuario( nickname );

            if ( ! user )
            {
                user = {
                    fullName : nickname,
                    nickname : nickname,
                    offline  : true
                };
            }

            chat = new Educativa.Eims.Chat( user, mostrar );

            this.fire( 'chatCreate', chat );

            chat.observe( 'close', function(chat) {
                this.closeChat( chat.user.nickname );
                this.saveSetting();
            }.bind(this) );

            chat.observe('show', this._on_show_chat.bind(this) );
            chat.observe('hide', this.saveSetting.bind(this) );

            this._chat.set( nickname, chat );

            // emitir sonido de alerta cuando se crea una nueva ventana de chat
            eims.playAlert(EIMSCore.SOUND_MESSAGE_RECEIVED);
            // iluminar ventana no visible
            chat.highlight();
        }
        else if (message && !chat._visible) {
            // emitir sonido de alerta cuando la ventana no esta visible
            eims.playAlert(EIMSCore.SOUND_MESSAGE_RECEIVED);
            // iluminar ventana no visible
            chat.highlight();
        }

        if( message )
        {
            chat.getChat().addMessage( message );
        }

        this.adjust();

        return chat;
    },

    _on_show_chat : function(chat) {
        var chats = this._chat.values();

        // oculto el menu
        $('eims_tab_window').hide();

        // cuando se muestra un chat oculto el resto
        for(var i=0; i<chats.length; i++)
            if( chats[i] !== chat )
                chats[i].hide();
        this.saveSetting();
    },

    closeChat : function(nick) {
        this.adjust();
        this._chat.unset(nick);

    },

    addUser : function(user)
    {
        this._addUser(user);
        eims.playAlert(EIMSCore.SOUND_USER_CONNECTED);
        new Educativa.Eims.SingInPopup(user);
    },

    removeUser: function(user){
        user = this._userList.find(function(e){ return e.nickname == user.nickname });
        this._userList.splice( this._userList.indexOf( user ), 1);
        $('eims_userlist_' + user.nickname ).remove();
        this.updateConnectedUsers();
        this.saveSetting();
    },

    saveSetting : function(){

        var keys = this._chat.keys();

        Cookie.set('eims_chats', keys.join('|') );
        Cookie.set('eims_active', '');

        for(var i=0; i<keys.length; i++)
        {
            var chat = this._chat.get( keys[i] );
            if( chat.isVisible() )
            {
                Cookie.set('eims_active', keys[i]);
                break;
            }
        }
    }


});

(function(){

    var _instance;
    Educativa.Eims.GetInstance = function( args ){
        if ( ! _instance ) _instance = new Educativa.Eims( args );
        return _instance;
    }

})();

Educativa.Eims.Panel = Class.create( Educativa.Observable, {
    initialize : function() {
        this._visible = false;

        var panel_tab =  this.element = new Element( 'span', { className: 'eims_chat_panel'})
            .insert( new Element( 'a' , { href: 'javascript:;' , className:'eims_btn_chat' } ) )
            .insert( new Element( 'div' , { className:'eims_tab_window', style: "right:9999px;"  } )
                    .insert( new Element( 'div' , { className:'eims_chat_header_div' } )
                        .insert( new Element( 'div' , { className:'eims_title' } )
                            .insert( new Element( 'a' , { href: 'javascript:;' , className:'eims_btn_close' } ) )
                            .insert( new Element( 'a' , { href: 'javascript:;' , className:'eims_btn_min' } ) )
                            .insert( new Element( 'strong' , {} ).update('&nbsp; ') )
                        )
                    )
                    .insert( new Element( 'div' , { className:'eims_chat_container' } ) )
            );
       this.findOne('.eims_btn_chat').observe(
            'click', this.toggle.bindAsEventListener(this) );

        this.panel = this.findOne('.eims_tab_window');

        this.container = this.findOne('.eims_chat_container');

        this.findOne('.eims_btn_close').observe(
            'click', this.close.bindAsEventListener(this));

        this.findOne('.eims_btn_min').observe(
            'click',this.hide.bind(this));

        //this.toolbar = new Educativa.Eims.PanelToolbar();

        //this.findOne('.eims_title').insert({after:this.toolbar.toElement() });

        $('eims_chat_list').insert( panel_tab );

    },
    isVisible : function(){
        return this._visible;
    },
    setTitle : function(text) {
        this.element.select( '.eims_btn_chat, .eims_title strong' ).invoke('update', text);
        return this;
    },
//    getToolbar : function() {
//        return this.toolbar;
//    },
    findOne : function( xpath ) {
        return this.element.select(xpath).first();
    },
    setWidth : function(pixels) {
        this.findOne('.eims_tab_window').setStyle( { width : pixels + 'px' } );
        return this;
    },
    getWidth : function() {
        return this.findOne('.eims_tab_window').getWidth();
    },
    setHeight: function(pixels) {
        this.findOne('.eims_tab_window').setStyle( { height : pixels + 'px' } );
        return this;
    },
    getHeight: function() {
        return this.findOne('.eims_tab_window').getHeight();
    },

    highlight : function(){
        new Effect.Highlight(this.element.identify(), { duration: 2 , restorecolor: 'transparent'} );
    },

    show : function(){
        if ( this._visible ) return ;

        this.fire('beforeShow');
        this._visible = true;

        this.panel.setStyle({right:'-1px'});

        this.element.addClassName('eims_chat_panel_opened');

        this.fire('show');
    },

    hide : function(){
        if ( ! this._visible ) return ;
        this._visible  = false;
        this.fire('beforeHide');
        this.element.removeClassName('eims_chat_panel_opened');
        this.panel.setStyle({right:'9999px'});
        this.fire('hide');

    },

    toggle : function(ev) {
        if ( ev ) ev.stop();
        if ( this._visible )
            this.hide();
        else
            this.show();
        this.fire('toggle');
    },
    close : function(ev) {
        var cerrar = true;
        var id_usuario = this.chatControl.user.nickname;
        var vc_mediator = false;
        try {
            vc_mediator = new Educativa.Aula.VideoChatMediator.getInstance()
        }catch (e){ console.log(e); }
        if (vc_mediator) {
            var vc = vc_mediator.getVideoChat(id_usuario);

            var cerrar = true;
            var estado = vc.getEstado();

            if( estado == 2 ){
                if( confirm( Educativa.Dict.translate('VC_SI_CIERRA_VENTANA_CANCELARA_LA_INVITACION').interpolate({nombre_usuario : id_usuario}).capitalize() ) )
                    vc.requestCancelInvitation();
                else
                    cerrar = false;
            }

            if( estado == 8 ){
                if( confirm( 'VC_DESEA_FINALIZAR'.term().capitalize()) )
                    vc.finalizarVC();
                else
                    cerrar = false;
            }

            if( estado == 4 ){
                if( confirm( 'si cierra rechazara la invitacion de ' + id_usuario ) )
                    vc.requestRejectInvitation();
                else
                    cerrar = false;
            }
        }
        if( cerrar ) {
            if ( ev ) ev.stop();
            try {
                var chat = Educativa.Aula.VideoChatMediator.getInstance().getVideoChat(id_usuario);
                chat.setEstado(32);
            } catch (e) {}
            this.element.remove();
            this.element=null;
            this.fire('close');
        }
    },
    add : function(content) {
        this.container.insert( content );
    }
});


Educativa.Eims.ChatControl = Class.create({
    initialize : function(user, mostrar)
    {
        this.user = user;
        this.messages = [];

        this.element = (new Element('div')).update(
              '<div class="eims_chat_messages_wrapper">'
              + '<div class="eims_chat_history" style="display:none">'
              + '</div>'
              + '<div class="eims_chat_messages">'
              + '</div>'
            + '</div>'
            + '<div class="eims_chat_input_div">'
              + '<textarea class="eims_chat_input" rows="1"></textarea>'
            + '</div>'
        );

        this.wrapper = this.element.select( '.eims_chat_messages_wrapper' )[0];

        this.input = this.element.select('.eims_chat_input')[0];

        this.input.observe('keydown', this.sendMessage.bindAsEventListener(this) );

        new Educativa.Eims.Autogrow( this.input );

    },
    toElement : function() {
        return this.element;
    },
    loadHistory : function(){
        var users = [ this.user.nickname ];

        eims.getMessageHistory(users , 10);

        this.loadHistory = Prototype.emptyFunction;
    },
    setHistory : function( messages )
    {
        for(var i=0; i<messages.length; i++)
        {
            var m = messages[i];

            if ( !( this.messages.length > 0 && this.messages.find( function(i){return i == m.message} )  ))
            {
                try
                {
                    var text = m.message.evalJSON().text;
                    if ( text )
                    {
                        var selfMessage = m.from != Educativa.Aula.User.id_usuario;
                        this.element.select('.eims_chat_history')[0].show();
                        this.printMessage( 'eims_chat_history', m.message.evalJSON().text, selfMessage );
                    }
                }
                catch(e)
                {
                }
            }
        }
    },

    sendMessage : function(ev)
    {
        var text = $F(ev.element());
        text = text.replace("\n",'');

        if ( ev.keyCode == 13 && text )
        {
            text = text.unescapeHTML();

            ev.stop();
            ev.element().value = "";
            var message = Object.toJSON({
                "text" : text,
                "nickname" : Educativa.Aula.User.id_usuario,
                "id": Educativa.Utils.generar_id(16)
            });

            eims.privateMessage(this.user.nickname, message, dsalt.valor, rest_url );
            this.printMessage('eims_chat_messages', text, true);
        }
    },

    addMessage : function(msg, selfMessage)
    {
        this.messages.push( msg );

        var msg = msg.evalJSON().text;

        this.printMessage( 'eims_chat_messages', msg, selfMessage );
    },

    printMessage : function(out, msg, selfMessage, isHTML )
    {
        // contenedor puede ser el div eims_chat_history o eims_chat_messages
        var contenedor = this.element.select('.' + out ).first();

        // calculamos grupo de mensajes por usuario
        var last = contenedor.childElements().size() > 0 ? contenedor.childElements().last() : false;

        // si el ultimo elemento es una notificacion debemos volver a imprimir la imagen del usuario
        if( last && last.childElements().size() > 0 && last.childElements().last().className == 'eims_videochat_notification' ){
            last = false;
        }

        // indica si el mensaje actual es una notificacion
        var es_notificacion = msg.className == 'eims_videochat_notification';

        var user_mensajes;
        if ( !es_notificacion && !( last && ( selfMessage && last.hasClassName('eims_chat_self_message')
                 || ! selfMessage && ! last.hasClassName('eims_chat_self_message') ) ))
        {

            last = new Element('div');
            last.addClassName('eims_chat_message');
            user_mensajes = new Element('div' , { className : 'user_mensajes' } );
            last = last.insert( user_mensajes  );

            last = last.insert( new Element('div' , { style : 'clear:both' } )  );

            contenedor.insert(last);

            var url_img = '';
            if ( selfMessage ){
                last.addClassName('eims_chat_self_message');
                 // mi img
                url_img = Educativa.Aula.User.url_foto;

            }else{
                // to img
                url_img = this.user.imageURL;
            }

            url_img = url_img.replace('thumb_60x68','thumb_40x45');
            var div = (new Element('div', { className : 'eims_avatar_chat' } ))
                    .setStyle( { backgroundImage: "url("+ url_img +")"} );

            user_mensajes.insert({before:div});

        }

        // el siguiente div contiene los mensajes agrupados (por parrafo)
        var contenedor_msg = es_notificacion ? contenedor : last.select('.user_mensajes').first();

        var li = es_notificacion ? msg : (new Element('div',{ className : 'linea_msj' })).update( msg );

        if( contenedor_msg.down() ){
            contenedor_msg.descendants().last().insert({after:li})
        }else{
            contenedor_msg.appendChild(li);
        }

        this.scrollToLast();


    },
    scrollToLast : function()
    {
        var view = this.element.select('.eims_chat_messages_wrapper').first();
        view.scrollTop = view.scrollHeight;
    },
    focus : function() {
        this.input.focus();
    },
    setHeight: function( pixel ) {
        this.wrapper.setStyle({ height:pixel + 'px'});
        return this;
    },
    getHeight: function() {
        return this.wrapper.getHeight();
    },
    resizeTo : function(width, height) {
        if ( height )
            this.setHeight( height );
        this.scrollToLast();
    }

});


Educativa.Eims.Chat = Class.create( Educativa.Eims.Panel, {
    initialize : function($super, user)
    {
        $super();

        this.user = user;
        this.messages = [];

        this.chatControl = new Educativa.Eims.ChatControl( user );
        this.add( this.chatControl );


        this.setTitle(user.fullName);

        this.element.id = 'eims_user_' + user.nickname;

//        if ( user.imageURL )
//        {
//
//            var img = user.imageURL.replace('thumb_60x68','thumb_40x45');
//
//            var div = (new Element('div', { className : 'eims_avatar' } ))
//                .setStyle( { backgroundImage: "url("+ img +")"} );
//
//            this.findOne( '.eims_title' ).insert({before: div});
//        }

        this.observe( 'beforeShow', function(){ this.chatControl.loadHistory() }.bind(this) );
        this.observe( 'show', function() {
            this.chatControl.scrollToLast();
            this.chatControl.focus();
        }.bind(this));

    },

    getUserData : function() {
        return {
            id_usuario : this.user.nickname,
            nombre : this.user.fullName
        };
    },
    toElement : function() {
        return this.element;
    },

    getChat : function() {
        return this.chatControl;
    }
});


Educativa.Eims.SetSoundBtn = Class.create( {

    initialize : function( container ){
        var myself  = this;

        this.element = new Element( 'span',{ id: 'eims_sound_btn', className: 'eims_ibox' } ).insert(
            this.link_element = new Element('a', {
                href : 'javascript:void(0);',
                className : 'eims_sound_status',
                title: ('EIMS_BTN_AUDIO_SILENCIAR'.term())
            }).update('&nbsp;')
        );

        this.element.hide();

        container.insert( this.element );

        this.link_element.observe( 'click', this.onClick.bindAsEventListener(this) );

        Educativa.Eims.GetInstance().onConnected( function (){
            myself.setSound( Educativa.Aula.User.eims_config.sound, true );
        });
    },

    setSound : function(status, ignorerequest) {

        if (!ignorerequest)
            new Ajax.Request(Educativa.Aula.User.eims_config.ajax_url + '?id_curso=' + Educativa.Aula.Group.id, {
                method: 'get',
                parameters : { set_sound : status?'true':'false' },
                onSuccess: function(transport) { }
            });
        eims.setSound(status);

        if(status){
            this.link_element.removeClassName('eims_sound_status_off');
        }else{
            this.link_element.title = 'EIMS_BTN_AUDIO_ACTIVAR'.term();
            this.link_element.addClassName('eims_sound_status_off');
        }

    },

    // cambiar el estado actual
    onClick : function(ev) {
        this.setSound(!eims.getSound());
    }

});

Educativa.Eims.Popup = Class.create({
    initialize : function(title, text, avatar){
        this.element = new Element( 'div', { className: 'eims_message'} );

        $('eims_messages').appendChild( this.element );

        this.element.hide();

        this.element.update( ''
            + '<div class="eims_body_wrap">'
            +   '<div class="eims_body">'
            +       '<a href="#" class="eims_btn_close"></a>'
            +       '<div style="display:none" class="eims_avatar"></div>'
            +       '<div class="eims_title" style="display:none"></div>'
            +       '<div class="eims_text"></div>'
            +   '</div>'
            + '</div>'
        );

        this.element.select( '.eims_btn_close' ).first().observe('click', this.hide.bindAsEventListener(this) );

        if(title) this.setTitle( title );
        if(text) this.setText( text );
        if(avatar) this.setAvatar( avatar );


    },

    show : function(){
        try {
            Effect.Appear(this.element.identify(), { duration : 1});
            if ( this.autoHideSeconds > 0) this.hide.bind(this).delay( this.autoHideSeconds );
        } catch(e){}
    },

    hide : function(ev){
        if (ev) ev.stop();
        var e = this.element.identify();
        if(!e ) return;
        try {
            Effect.Appear(e , {
                duration : 1,
                from : 1,
                to : 0,
                afterFinish : function(){ if( $(this.element) ) this.element.remove() }.bind(this)}
            );
        } catch(e){}
    },

    setTitle : function( title ){
        if ( title )
            this.element.select('.eims_title').first().show().update(title);
        else
            this.element.select('.eims_title').first().hide().update(title);
    },

    setText : function( title ){
        this.element.select('.eims_text').first().update(title);
    },

    setAvatar : function( url_avatar ){
        var avatar = this.element.select('.eims_avatar').first();
        if ( url_avatar )
            avatar.show().setStyle({background:'transparent url(' + url_avatar + ') no-repeat 0 0'});
        else
            avatar.hide();
    }

});

Educativa.Eims.SingInPopup = Class.create(Educativa.Eims.Popup, {
    autoHideSeconds :  10,
    initialize : function($super, user)
    {
        var txt = Educativa.Dict.translate('USUARIO_HA_INICIADO_SESION').interpolate({
                usuario: '<span class="eims_message_nombre">' + user.fullName.escapeHTML() + '</br> </span>'});
        txt = '<a href="#" class="eims_singin_text">' + txt + '</a>';
        $super( false, txt, user.imageURL);
        this.element.addClassName('eims_singin_popup')
        this.element.select('.eims_singin_text').first().observe('click', function(ev){
            Educativa.Eims.GetInstance().highlightUser(user.nickname);
        });

        this.show();
    }
});

Educativa.Eims.EmailPopup = Class.create(Educativa.Eims.Popup, {
    autoHideSeconds :  10,
    initialize : function($super, user)
    {
        var txt = Educativa.Dict.translate('HA_RECIBIDO_UN_NUEVO_MENSAJE_DE_CORREO_ELECTRONICO_EIMS').interpolate({
            usuario: '<span class="eims_message_nombre">' + ( user.nombre +' '+ user.apellido).escapeHTML() + '</span>' ,
            url_webmail: 'webmail.cgi?id_curso=' + Educativa.Aula.Group.id

        });

        txt = '<span class="eims_email_popup">' + txt + '</span>';

        $super( false, txt , user.url_foto);

        this.element.addClassName('eims_email_popup');

        eims.playAlert(EIMSCore.SOUND_NEW_EMAIL);

        this.show();

    }
 });

Educativa.Eims.ChatInvitationPopup = Class.create(Educativa.Eims.Popup, {
    autoHideSeconds :  0,
    initialize : function($super, user)
    {
        var txt = Educativa.Dict.translate('USUARIO_TE_INVITA_A_LA_SALA_DE_CHAT').interpolate({
            usuario: '<span class="eims_message_nombre">' + ( user.nombre +' '+ user.apellido).escapeHTML() + '</span>'});

        txt = '<span class="eims_invitation_text">' + txt + '</span>';

        $super( false, txt , user.url_foto);

        this.element.addClassName('eims_invitation')

        this.element.select('.eims_link').first().observe(
            'click', this.on_click.bindAsEventListener(this) );

        eims.playAlert(EIMSCore.SOUND_CHAT_INVITE);
        this.show();

    },
    on_click:function(ev){
        ev.stop();
		this.hide();
        OpenWin();
    }

})

Educativa.Eims.Autogrow = Class.create({
    line_height : 13,
    min_height: '13',
    max_height: '111',

    initialize : function(element)
    {
        this.element = element;

        new PeriodicalExecuter( this._expandInput.bind(this), .5 );
    },
    _expandInput : function()
    {
        var el = this.element;
        if (this.dummy == null)
        {
            this.dummy = new Element('div');
            this.dummy.setStyle({
                'fontSize'  : el.getStyle('fontSize'),
                'fontFamily': el.getStyle('fontFamily'),
                'width'     : '200px',
                'padding'   : el.getStyle('padding'),
                'lineHeight': this.line_height + 'px',
                'position'   : 'absolute',
                'top'        : '0',
                'left'       : '-9999px'
            });
            $(document.body).appendChild(this.dummy);
        }

        this.dummy.setStyle({'width': el.getWidth() + 'px' })

        // Strip HTML tags
        var html = $F(el).escapeHTML().replace(/\s\s/g, '&nbsp; ').replace( /\s$/, '&nbsp;' );

        // IE is different, as per usual
        /*
        if ($.browser.msie)
        {
            html = html.replace(/\n/g, '<BR>new');
        }
        else
        {
            html = html.replace(/\n/g, '<br>new');
        }
        */
        this.dummy.update( html );

        var h = this.dummy.getHeight();

        if( h > this.max_height ) h = this.max_height;
        if( h < this.min_height ) h = this.min_height;

        this.element.setStyle({ 'height' : h + 'px' } );
    }
});


Educativa.Eims.UserMenu = Class.create(Educativa.Observable, {
    initialize : function(user) {

        this.user = user;
        this.element = (new Element('div'))
            .update('<ul></ul>')
            .hide()
            .addClassName('eims_user_menu');

        var ul = this.element.down();

        var user_menu = [
            {text:'INICIAR_MINICONVERSACION', id:'minichat'},
            {text:'INVITAR_AL_CHAT'         , id:'chat'    },
            {text:'ENVIAR_EMAIL'            , id:'email'   },
            {text:'VER_PERFIL'              , id:'perfil'  },
            {text:'VC_INICIAR_VIDEOCHAT'    , id:'videochat'}
        ];

        for( var i = 0; i < user_menu.length; i++ )
        {
            var e = user_menu[i];

            // si el comando no esta activo en la configuracion del eims en la session de usuario
            if ( ! user.eims_config.menu.find( function(i){ return i == e.id } ))
                continue;

            // opciones que dependen solo de mi config,
            // si yo no tengo la mensajeria activada no puede chatear con otro
            if ( e.id=='minichat' && Educativa.Aula.User.eims_config.menu.indexOf('minichat') < 0)  continue;
            if ( e.id=='chat' && Educativa.Aula.User.eims_config.menu.indexOf('chat') < 0) continue;
            if ( e.id=='videochat' && Educativa.Aula.User.eims_config.menu.indexOf('videochat') < 0) continue;


            var li = (new Element('li'))
                .update( '<a href="#">' + e.text.term().capitalize().escapeHTML() + '</a>' )
                .observe('click', this._click.bindAsEventListener(this, e) )
                .observe('click', function(){ this.element.hide() }.bind(this));
            ul.appendChild( li );
        }

        // cuando el mouse pierde el foco
        document.observe('mouseover', this._mouseover.bindAsEventListener(this));
    },
    getUser : function(){
        return this.user;
    },
    toElement : function() {
        return this.element;
    },
    _mouseover : function(ev){
        var _target = this.element.up();
        var m = _target.select('.eims_user_menu').first();

        try{
            if ( ev.element().ancestors().find(function(e){ return e === _target }) ) {

                var menu_off = Element.cumulativeOffset(m);
                var off =    (_target.cumulativeOffset().top - _target.up().scrollTop)
                          - $('eims_tab_window').cumulativeOffset().top;
                t = ( off + (_target.getHeight() - m.getHeight()) / 2 );
                _target.addClassName('eims_usermenu_hover')

                m.setStyle({left: - (m.getWidth()-8) + 'px', top: t + 'px'});
                m.show();
            }
            else if ( _target.visible() ) {
                _target.removeClassName('eims_usermenu_hover')
                m.hide();
            }
        }catch(e){}
    },

    _click : function(event, e){
        event.stop();
        this.fire( 'click', e );
    }
});


/************************************************
 ******** Inicializacion del video chat *********
 ************************************************/

Educativa.Eims.GetInstance().observe('chatCreate', function(sender,chat){

  if ( Educativa.Aula.User.eims_config.menu.indexOf('videochat') > 0)
  {
    $LAB.script('Educativa/Aula/VideoChat.js').wait(function(){

        var vc = Educativa.Aula.VideoChatMediator.getInstance();

        var fn = function(sender){
              Educativa.Aula.VideoChatMediator.getInstance()
                  .sendInvitation(this.user.nickname);
                  }.bind(chat);

        var btnOpen = (new Element('a', {
                className : 'eims_btn_vc' ,
                title : Educativa.Dict.translate('VC_INICIAR_O_FINALIZAR_VIDEO1A1').capitalize()
            })).observe('click', fn ).update('&nbsp;');

        chat.element.select('.eims_btn_min').first().insert({after: btnOpen});

        var ins = Educativa.Aula.VideoChatMediator.getInstance();

        ins.observe( 'start', function(sender, video){
          this.addClassName('videochat-cam');
        }.bind( btnOpen ) );

        ins.observe( 'end', function(sender,video){
          this.removeClassName('videochat-cam');
        }.bind( btnOpen ) );


    });
  }
});


