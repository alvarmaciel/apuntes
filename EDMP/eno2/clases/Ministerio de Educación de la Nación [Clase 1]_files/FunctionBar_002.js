/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
Educativa.FunctionBar = Class.create({
    clase_separador: 'separador',
    initialize: function(args){

        this.container =  window.document.body;

        Object.extend( this, args);

        // Frame //
        $(this.container).insert(
            this.frame = new Element('div', { className: 'FunctionBar-Frame' })
        );

        // Borde superior //
        this.frame.insert( new Element('div', { className: 'BorderTop' } ) );

        // Body //
        this.frame.insert( this.body = new Element('div', { className: 'Body' }) );

        this.render_botonera();

        this.is_centrado = $$('body').first().hasClassName('centrado');
        if( this.is_centrado ) this.center_bar();
    },

    center_bar: function(){
        var  w = document.viewport.getWidth();
        var left = (w - this.frame.getWidth())/2;
        this.frame.setStyle({ left: left +'px' });
    },

    get_nombre_usuario: function(){
        return this.user_nombre_completo.split(' ').map( function( palabra ){
            return palabra.capitalize()
        }).join( ' ' );
    } ,

    get_url_logout: function(){

        if( this.url_login_unico ){
            return this.url_login_unico + "index.cgi?wAccion=logout";
        }

        if ( this.standalone ){
            /* Utilizado por sitio standalone, ya que el aula standalone utiliza el
            FunctionBar que es encuentra definido en Educativa/Aula/FunctionBar.js */
            return this.url_logoff + "index.cgi?wAccion=cerrar";
        }else{
            /* Utilizado por sitio y bitacora en entorno open, se redirige al logoff
            del aula */
            return this.url_logoff + "logoff.cgi";
        }


    } ,

    render_separador: function(){
        this.body.insert(
            new Element('span', {
                className: this.clase_separador
            }).update( "|" )
        );
    },

    render_nombre_usuario: function(){
        var nombre_usuario = this.get_nombre_usuario();

        this.nombre_usr_frame = new Element('span', {
            className: 'NombreUser-Frame'
        }).update( nombre_usuario );

        this.usuario_frame = new Element('span', {
            className: 'Usuario'
        }).insert(this.nombre_usr_frame);

        this.body.insert( this.usuario_frame );
    } ,

    render_btn_logout: function(){
        this.render_separador();

        this.btn_logout = new Element('a', {
            className: 'Logout',
            title: Educativa.Dict.translate('CERRAR_LA_SESION_ACTUAL').capitalize(),
            href: 'javascript:;'
        }).update( Educativa.Dict.translate('CERRAR_SESION').capitalize() );

        this.body.insert( this.btn_logout );
        this.btn_logout.observe('click',function(){
            if( confirm( Educativa.Dict.translate('CONFIRMAR_CERRAR_SESION_ACTUAL') ) ){
                this.cerrar_sesion();
            }
        }.bind(this));
    } ,

    // btn que redirige a login centralizado
    render_btn_lc: function(){
        if( this.url_login_unico && this.cant_productos_lc > 1 ){
            this.render_separador();
            this.btn_logout = new Element('a', {
                className: 'Logout',
                title: Educativa.Dict.translate('CAMBIAR_DE_PRODUCTO').capitalize(),
                href: this.url_login_unico
            }).update( Educativa.Dict.translate('CAMBIAR_DE_PRODUCTO').capitalize() );
            this.body.insert( this.btn_logout );
        }
    },

    render_botonera: function(){
        this.render_nombre_usuario();
        this.render_btn_lc();
        this.render_btn_logout();
    },

    cerrar_sesion: function(){
        window.location = this.get_url_logout();
    },

    render_btn_administracion : function() {
        if( this.url_administracion ) {
            this.render_separador();
            this.btn_administracion = new Element('a', {
                className : 'Logout',
                title : Educativa.Dict.translate('IR_A_LA_ADMINISTRACION'),
                href : this.url_administracion
            }).update( Educativa.Dict.translate('ADMINISTRACION' ) );
            this.body.insert( this.btn_administracion );
        }
    }
});

