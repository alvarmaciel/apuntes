/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
/**
 * @namespace Educativa.Aula clases y funciones del aula
 */
Educativa.Aula = {
    /**
     * @namespace Educativa.Aula.Control controles del aula  */
    Control : {
        MailTo:  function(args) {

            if( ! args.url_mensajeria )
                args.url_mensajeria = 'mensajeria.cgi';

            var params_tpl = "#{url_mensajeria}?";

            if( args.id_curso ){
                if( args.id_curso != 0 ){
                    params_tpl += "wIdDestino=#{to}&";
                    params_tpl += "id_curso=#{id_curso}&";
                }
            } else {
                if( self.id_grupo && self.id_grupo != 0 ) {
                    args.id_curso = id_grupo;

                    params_tpl += "wIdDestino=#{to}&";
                    params_tpl += "id_curso=#{id_curso}&";
                }
            }

            if(args.subject)
                params_tpl += "wAsunto=#{subject}&";

            if(args.message)
                params_tpl += "wMensaje=#{message}&";

            if(args.IdEmailEnviadosReenvio)
                params_tpl += "wIdEmailEnviadosReenvio=#{IdEmailEnviadosReenvio}&";

            if(args.IdEmail)
                params_tpl += "wIdEmail=#{IdEmail}&";

            if(args.IdEmailEnviadosResponder)
                params_tpl += "wIdEmailEnviadosResponder=#{IdEmailEnviadosResponder}&";

            if(args.IdEmailEnviadosResponderATodos)
                params_tpl += "wIdEmailEnviadosResponderATodos=#{IdEmailEnviadosResponderATodos}&";

            if(args.mostrarUrlActual)
                args.message += "URL: "+document.location.href;

            if(args.mail_to_admin)
                params_tpl += "mail_to_admin=#{mail_to_admin}&";

            var tmpl   = new Template( params_tpl );

            args.subject = escapar(args.subject);
            args.to = escapar(args.to);
            args.message = escapar(args.message);

            new Educativa.Popup({
                url : tmpl.evaluate(args),
                width : 742,
                height : 600,
                resizable: false,
                status : false
            });
            
            return;
        },

        VerMensajeInadmisible: function( texto ){

            var ventana = new Educativa.Popup({
                name : 'MensajesWin' ,
                width : 450,
                height : 200,
                resizable: false,
                status : false
            });

            var MensajesWin = ventana.window;

            MensajesWin.document.write('<HTML><TITLE> Ver asignaciones del usuario</TITLE><link rel="stylesheet" href="" type="text/css">\n<body bgcolor="#FFFFF4">\n');
        	MensajesWin.document.write(texto);
        	MensajesWin.document.write('</body></HTML>\n');
        	MensajesWin.document.close();
        	MensajesWin.focus();

        	return;

        }
    },
    verInfoUsuario: function(id_usuario, id_curso) {
        var url = 'perfil.cgi?id_usuario=' + id_usuario + " &id_curso= " + id_curso;
        var alto = 440;

        var winl = (screen.width - 360) / 2;
        var wint = (screen.height - alto) / 2;
        props = "Toolbar=no,Location=0,directories=0,status=0,menubar=0,resizable=1,width=670,height=450"
            + ",scrollbars=1,top="
            + wint
            + ",left="
            + winl;
        window.open(url, "Data", props);
        return;
    },

    /**  Retorna true si se invoca desde el backend, false en caso contrario
       Debe llamarse despues de que se haya cargado el contenido */
    is_backend: function() {
        return $$('body').first().hasClassName('backend');
    },

    /** Retorna true si se esta usando un skin 920 (ancho), false en caso contrario
        Debe llamarse despues de que se haya cargado el contenido */
    is_920: function () {
        return $$('body').first().hasClassName('ancho_920');
    }


};

/** Bakcward Compatibility para link antiguos que nunca fueron modificados. */
function MailTo(destinatario, asunto){
    Educativa.Aula.Control.MailTo({ to : destinatario, subject : asunto });
}

/** Bakcward Compatibility para link antiguos que nunca fueron modificados. */
function winHelp(){
	Educativa.popupAyuda({ url: window.url_ayuda_popup });
};

/** @namespace Metodos para trabajar con recursos del aula */
Educativa.Aula.Recursos = {

    get_link: function(item){
        var tipo = Educativa.Aula.Recursos.get_type(item);
        if( tipo == 'sitio' ) return 'http://'+item.nombre;
        var nombre = (tipo == 'micrositio' ? 'html/'+item.index_html : item.nombre );
        return "#{url}/archivos/repositorio/#{dir}/#{id}/#{nombre}".interpolate({
            url: url_dir,
            dir: Math.floor(item.id/250)*250,
            id: item.id,
            nombre: nombre
        });
    },

    types: function(){
        return $A([
            'audio',
            'calculo',
            'comprimidos',
            'doc',
            'ebook',
            'ejecutables',
            'flash',
            'html',
            'imagen',
            'micrositio',
            'presentacion',
            'sitio',
            'texto',
            'video',
            'www'
        ]);
    },

    get_type: function( rec ){
        var filename  = rec.nombre;

        if( rec.tipo == 'Micrositio' ) return 'micrositio';
        if( rec.tipo == 'Sitio' )      return 'sitio';

        var arr = filename.match(/\.(\w+)$/);

        if( ! arr ) return 'www';

        var ext = arr[1].toLowerCase();
        var type = '';

        switch( ext ){
            case "gif":
            case "bmp":
            case "jpg":
            case "jpeg":
            case "png":
                type = 'imagen';
                break;
            case "swf":
                type = 'flash';
                break;
            case "asf":
            case "avi":
            case "asx":
            case "aif":
            case "aifc":
            case "dif":
            case "dv":
            case "flv":
            case "mov":
            case "m1v":
            case "movie":
            case "mp4":
            case "mpe":
            case "mpeg":
            case "mpg":
            case "mp4":
            case "qt":
            case "wmv":
            case "flv":
                type = 'video';
                break;
            case "aac":
            case "aif":
            case "aifc":
            case "aiff":
            case "au":
            case "m3u":
            case "mid":
            case "mp3":
            case "mp2":
            case "mpa":
            case "ra":
            case "ram":
            case "rmi":
            case "rm":
            case "snd":
            case "wav":
            case "wax":
            case "wma":
                type = 'audio';
                break;
            case "htm":
            case "html":
                type = 'html';
                break;
            case "pdf":
                type = 'ebook';
                break;
            case "txt":
                type = 'texto';
                break;
            case "doc":
            case "docx":
            case "sdw":
            case "sxw":
            case "stw":
                type = 'doc';
                break;
            case "xls":
            case "xlsx":
            case "sdc":
            case "stc":
                type = 'calculo';
                break;
            case "pps":
            case "sdd":
            case "sxi":
            case "sti":
                type = 'presentacion';
                break;
            case "gtar":
            case "gz":
            case "gzip":
            case "hqx":
            case "jar":
            case "rar":
            case "sit":
            case "tar":
            case "tgz":
            case "zip":
                type = 'comprimidos';
                break;
            case "exe":
            case "dll":
            case "dll2":
            case "reg":
            case "ini":
            case "sys":
                type = 'ejecutables';
                break;
            default:
                type = 'www';
        }

        return type;
    },

    es_incrustable: function( rec ){

        if( rec.tipo == 'Micrositio' ) return true;
        if( rec.tipo == 'Sitio' )      return false;

        var incrustables = $A([
            "gif","bmp","jpg","jpeg","png","swf","avi","asf","asx","mpg","mpeg","m1v","mpe","qt","aif",
            "aifc","mov","wmv","mpeg","mp4","flv","wav","mp2","mp3","mpa","mid","rmi","au","snd","wma",
            "wax","pdf","txt","doc","sdw","sxw","stw","xls","sdc","stc","pps","sdd","sxi","sti"
        ]);

        var arr = rec.nombre.match(/\.(\w+)$/);
        if( ! arr ) return false;
        var ext = arr[1].toLowerCase();
        if( incrustables.include( ext ) ) return true;

        return false;
    },

    get_code_incrustacion: function( rec ){

        var codigo_inscrustacion = "<img "
            +"style='vertical-align: middle;' "
            +"src='#{url_img}' "
            +"alt='#{link_incr}' "
            +"#{width_img} "
            +"#{height_img} "
            +"name='#{clase}' "
            +"class='edu_incrustacion #{clase}' "
            +"id='#{id}' "
        +">";

        var tipo = Educativa.Aula.Recursos.get_type( rec );

        //fixme incompleto
        var link_incr = Educativa.Aula.Recursos.get_link(rec);

        var url_img,
            width = 480,
            height = 250;
        if(      tipo == 'imagen' )
            url_img = link_incr;
        else if( tipo == 'micrositio' ){
            url_img = url_dir+'administracion/images/imagen_html.gif';
            width = rec.width;
            height = rec.height;
        }
        else
            url_img = url_dir+'administracion/images/imagen_'+tipo+'.gif';

        var params = {
            url_img: url_img,
            link_incr: link_incr,
            width_img:   (tipo == 'imagen' ? '' : "width='"+width+"'"),
            height_img:  (tipo == 'imagen' ? '' : "height='"+height+"'"),
            clase: 'incrustar_'+tipo,
            id: 'recurso-'+rec.id
        };

        return codigo_inscrustacion.interpolate( params );
    },

    get_code_link: function( rec, secc_id ){
         secc_id = secc_id ? secc_id : 0;
         var codigo_link = "<a "
            +"href='#{href}' "
            +"class='edu_rec_link LinkModi #{clase}' "
            +"id='#{id}' "
            +"target='_NEW' "
        +"><strong>#{link_text}</strong></a>";

        return codigo_link.interpolate({
            href: "location.cgi?wseccion="+secc_id+"&id_curso="+id_grupo+"&wid_repositorio=R1&wid_objeto="+rec.id,
            id: 'recurso-'+rec.id,
            link_text: rec.titulo
        });

    }

};


Educativa.Aula.Upload = Class.create(
/** @lends Educativa.Aula.Upload.prototype */
{
    instancia : "",
    idioma : "es",
    tam_perm : "",
    ext_perm  : "",
    file_upload_limit : 1,
    file_queue_limit : 0,
    center_file_popup: false,
    cant_adjuntos_previos : 0,
    regla : "",
    extensiones : "",
    no_ocultar_div : 0, //Activando este parametro no ocultamos la div al eliminar un archivo
    eliminar_directorio : 0, //Activando este parametro eliminamos todo el directorio que contiene los archivos subidos

    /**
       Control para subir archivos a la plataforma. El mismo, dependiendo de si esta activado flash, utiliza
       un backed en flash, o bien, en HTML.
       @param args
       @param args.instancia ID unico que permite vincular al archivo subido para luego copiarlo/moverlo donde deseemos.
       @param args.url_swf url donde se encuentra swf por EJ: http://chino.e-ducativa.x/open/lib/javascript/swf
       @param args.url_dir necesario para realizar el upload fisico del archivo en el disco (utilizando el SWFUpload.cgi).
       @param args.btn_img url de la Imagen del boton.
       @param args.file_data_container
       @param args.upload_btn_container
       @constructs
    */
    initialize: function( args ){

        Object.extend( this, args);

        this.settings = {
            flash_url : this.url_swf + "swfupload/swfupload.swf",
            upload_url: this.url_dir + "SWFUpload.cgi",
            post_params : {
                "instancia" : this.instancia,
                "accion" : "upload"
            },
            file_size_limit : this.tam_perm,
            file_types : this.ext_perm,
            file_types_description : "All Files",
            file_upload_limit : this.file_upload_limit,
            file_queue_limit : this.file_queue_limit,
            custom_settings : {
            	progressTarget : "fsUploadProgress",
            	cancelButtonId : "btnCancel"
            },
            customSettings : {
            	progressTarget : "fsUploadProgress"
            },
            stats : {
                successful_uploads: 0 /* evaluar bien esto */
            },
            term_subirarchivo: 'SUBIR_ARCHIVO'.termcap(),
            debug: false,

            // Button settings
            button_image_url: this.btn_img,
            button_width: args.button_width || "120",
            button_height: args.button_height || "26",
            button_placeholder_id: "spanButtonPlaceHolder",
            button_cursor : SWFUpload.CURSOR.HAND,
            button_window_mode : SWFUpload.WINDOW_MODE.OPAQUE,
            //debug: true,
            //debug_handler : function(arg){ console.log('debug'); console.log(arg); },

            // The event handler functions are defined in handlers.js
            file_queued_handler : fileQueued,
            file_queue_error_handler : fileQueueError,
            file_dialog_complete_handler : fileDialogComplete,
            file_dialog_start_handler : this.OpenFileDialogEventHandler.bindAsEventListener(),
            upload_start_handler : uploadStart,
            upload_progress_handler : uploadProgress,
            upload_error_handler : uploadError,
            upload_complete_handler : this.uploadSuccessEventHandler.bindAsEventListener(this),
            upload_success_handler : uploadSuccess,
            swfupload_loaded_handler: this.onFlashReady,
            queue_complete_handler :  queueComplete,
            instancia : this.instancia,
            cant_adjuntos_previos : this.cant_adjuntos_previos,
            tipo_regla_adjuntos: this.regla,
            extensiones_regla: this.extensiones,
            idioma: this.idioma,
            no_ocultar_div: this.no_ocultar_div,
            eliminar_directorio: this.eliminar_directorio,
            center_file_popup: this.center_file_popup,
            old_button_width: args.button_width,
            old_button_height: args.button_height,
            PostDeleteFile : this.PostDeleteFile.bindAsEventListener(this)
        };

        this.upload_btn_container.insert(
            new Element('span',{id: 'divMovieContainer'})
                    .insert( new Element('span',{id: 'spanButtonPlaceHolder'})  )
        );

        this.file_data_container.insert({ top : //fixme
            new Element('div',{ id: 'fsUploadProgress', className: "fieldset flash", style:"display:none"})
                .insert( new Element('span',{className: 'legend'}) )
        });

        this.iniciarSWF();

    },

    iniciarSWF: function(){
        //Esta MUY mal que se use una variable global. Blame Chino. Tarde o temprano, deberemos arreglarlo. fixme
        if( Educativa.flash_desactivado  || ! DetectFlashVer(10, 0, 0) ){
            swfu = new Educativa.HTMLUpload(this.settings);
        }else{
            swfu = new SWFUpload(this.settings);
            /** @ignore */
            swfu.hideButton = function(){ swfu.setButtonDimensions(0,0); };
            /** @ignore */
            swfu.showButton = function(){
                /* Al setear el tamanio del boton en 0 y 0, pisamos los valores de las variables this.settings.button_width y this.settings.button_height;
                Por esta razon utilizamos los almacenados en old_button_width y old_button_height (para volver a los valores iniciales). */
                swfu.setButtonDimensions( this.settings.old_button_width, this.settings.old_button_height )
            };
        }
    },

    /** Funcion utilizada para realizar operaciones posteriores al completar el upload */
    uploadSuccessEventHandler: function(file){
        /* Aca va la logica de micrositio */
    },

    /** Funcion utilizada para realizar operaciones anteriores al abrir el dialogo de seleccion de archivos */
    OpenFileDialogEventHandler: function(){},

    onFlashReady: function(){}, //virtual func, o como parametro

    /* Funcion utilizada para realizar acciones cuando se elimina un archivo; Utilizado en Admin Repositorio */
    PostDeleteFile: function(file){}
});


// deshabilitar la escritura en input[type="file"]
Event.observe(window,'load',function(){
    Educativa.Utils.disable_input_file_keypress();
});

/**
* @namespace Educativa.Aula.View Vistas del aula.
*/
Educativa.Aula.View = {};


