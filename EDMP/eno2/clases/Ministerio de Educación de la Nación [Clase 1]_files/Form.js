/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
Educativa.Control.Forms = {};
Educativa.Control.Form = Class.create(Educativa.Control, {
    initialize : function($super, form)
    {
        if ( ! Educativa.Control.Forms[ form.id ] )
        {
            $super( form.id );
            this.form = form;
            this.funciones_validacion = new Array();
            this.funciones_submit     = new Array();

            // form indicator
            var submit = this.element.select( 'div.submit' ).first();

            if ( submit )
            {
                this.indicator = new Element('div',
                    { className : 'ajax_indicator form_indicator' } );

                Position.clone( submit, this.indicator, {
                    setWidth: false, setHeight: false, setLeft: false, setTop: false
                });
                submit.appendChild( this.indicator ).hide();
            }

            // no uso observe() porque es necesario q se ejecute lo mas pronto posible
            this.element.onsubmit = this.submit.bindAsEventListener(this);

            Educativa.Control.Forms[ this.form.id ] = this;
            var invalid = this.element.select('.invalido .control').first();
            if ( invalid ) {
                try { invalid.focus() }
                catch(e){};
            }
            else if (this.form.auto_focus )
                try {
                    var el = this.element.findFirstElement();
                    if (el && el.tagName.toLowerCase() != 'textarea')
                        el.activate();
                }
                catch(e){};

        }
    },
    canceled : false,
    submit : function(e)
    {
        if ( ! this.canceled && ! this.validar() )
        {
            if ( e ) Event.stop(e);
            this.fire('onInvalid');
        }
        else if ( this.form.ajax )
        {
            var form = this.form;
            if ( e ) Event.stop(e);
            $( form.id ).request({
                parameters : { wPartial : 1},
                onCreate   : Form.disable.bind(Form, this.element ),
                onComplete : Form.enable.bind(Form, this.element ),
                onSuccess : function(tr)
                {
                    var result = tr.responseText.evalJSON();
                    if ( result.state == 1 ){
                        new Educativa.Alert( {
                            type : 'info',
                            text : 'Se guardo ok'
                        } );
                        $( form.id ).reset();
                        if (tinyMCE) form.controles().each(function(f){
                            if (f.clase == 'RichText' )
                            tinyMCE.updateContent(f.id);
                        })
                    }

                }
            });
        }
        else
        {

            // Funciones extras para procesar datos del formulario
            this.funciones_submit.each(function(f){ f(); });

            if ( !e ) this.element.submit();

            //Se pregunta por el boton submit comun
            if($('wOk')){
                $('wOk').addClassName( 'inputSubmitDisabled');
            }
            //Se pregunta por el boton submit "guardar y seguir" de la seccion presentacion(Backend)
            if ($('wOkEdit')){
                $('wOkEdit').addClassName( 'inputSubmitDisabled');
            }
            //Se pregunta por el boton submit de la seccion importacion
            if($('wCancel')){
                $('wCancel').addClassName( 'inputSubmitDisabled');
            }

            //Se setea isNotDirty en 1 => necesario para el plugin autosave.
            try {

                if (tinyMCE){
                    for (i=0; i < tinyMCE.editors.length; i++){
                        var ed = tinyMCE.get(tinyMCE.editors[i].editorId);
                        ed.isNotDirty = 1;
                    }
                }
            }catch(e){};

            if (this.indicator) this.indicator.show();
            Form.disable.delay(0, this.element );
        }

    },
    controles : function(){
        return this.element
                   .select('*')
                   .findAll(function(e){return e['E']})
                   .invoke('E')
                   .reject( Object.isUndefined )
    },
    validar_elemento : function(element){

        if( this.form.tiene_tabs ){
            var result = element.validar(this.master_form());
            return result;
        }
        return ! element.isVisible || ! element.isVisible() || element.validar(this.master_form());
    },
    validar_elementos : function( elementos ){
        var result = elementos.partition( this.validar_elemento.bind(this) );
        var invalidos = 0;
        result[0].each(function(e){ if ( e.valido   ) e.valido()   });
        result[1].each(function(e){
            if ( e.invalido ) {
                e.invalido();
                invalidos++;
            }
        });
        if( this.form.tiene_tabs && invalidos ){
            // Cambiar pestania
            Educativa.informacion_personal.change_tab('perfil');
        }
        return result;
    },
    master_form: function(){
       //pathetic hack
       return (this.accordian && this.accordian.accordian_form) ? this.accordian.accordian_form : this;
    },
    validar : function ()
    {

        this.error_mssgs = [];
        this.confirm_mssgs = [];
        /* Lista con dos arrays, el primero de elementos que validaron
           el segundo con los elementos que no validaron */
        var result = this.validar_elementos( this.controles() );

        // dejo seteada la propiedad status como resultado de la validacion
        // true : hay errores, false : correcto
        this.status = result[1].length;
        if( result[1].length > this.error_mssgs.length ){
            this.add_error_mssg( this.form.invalid_text );
            return false;
        }

        if ( this.status )
        {
            this.invalido();
            result[1].first().select();
            return false;
        }
        else
        {
            // verifico las funciones personalizadas de validacion
            var validacion_extra = true;
            this.funciones_validacion.each(function(f){
                validacion_extra = f() && validacion_extra;
            });
            if (validacion_extra) return this.valido();

            this.invalido();
            return false;
        }

    },
    invalido : function()
    {
        this.error_mssgs.each(function(mssg){
            if( mssg ){
                alert( mssg.stripTags() );
            }
        });
        return false;
    },
    valido : function(){
        var confirmado = true;
        this.confirm_mssgs.each(function(mssg){
            if( ! confirm(mssg) ){
                confirmado = false;
                throw $break;
            }
        });
        if( !confirmado ) return false;

        return ! this.form.confirm || confirm(this.form.confirm);
    },

    add_error_mssg: function(mssg) {
        this.error_mssgs.push( mssg );
    },

    add_confirm_mssg: function(mssg) {
        this.confirm_mssgs.push( mssg );
    },

    // agrega una funcion javascript personalizada
    agregar_validacion : function (func)
    {
        this.funciones_validacion.push(func.bind(this));
    },

    agregar_submit_rutine:  function (func){
        this.funciones_submit.push(func.bind(this));
    }
});

Educativa.Control.Form.newInput = function(options) {
    return Educativa.Control[options.clase]
        ? new Educativa.Control[options.clase]( options )
        : new  Educativa.Control.InputBase( options );
};




/* Validaciones en javascript
 *
 */
Educativa.Control.Base = Class.create(Educativa.Control, {
    initialize : function($super, options ){
        Object.extend( this, options);

        if ( options.element ){
            this.id = this.element.id;
            this.name = this.element.name;
        }

        $super( this.id );

        this.element = this.element || $( this.name + '_0');


        this._validacion_especiales = [];

        try {
            if( this.element ){
               this.form = this.element.ancestors().find(function(e){ return e.tagName.toLowerCase() == 'form'});
               this.line = this.element.ancestors().find(function(e){ return e.hasClassName('line') } );
            }
        } catch(e){};

        if ( this.element ) ['blur', 'focus'].each(
            function(f){this.element.observe(f, this[f].bindAsEventListener(this) )}.bind(this)
        )

        if( options.tooltip )
            this.tooltip = new Educativa.Tooltip({
                trigger : $(options.tooltip + 'bt'),
                html    : $(options.tooltip + 'tt').remove().innerHTML,
                canFixed: true,
                id      : this.id
            }).hide();
    },
    editable : function(){
        return this.clase != 'LabelText';
    },
    isVisible : function(e){
        return this.element.visible()
               && ! this.element.ancestors().find(function(e){return ! e.visible()
                    // y no es del accordion, hack
                    && ! e.hasClassName('contents') })
    },
    focus : function (e){
        if ( !this.visible() ) return ;
        $(this.id).addClassName( 'focus');
        try { $(this.id).select() } catch(e){};
    },
    blur  : function (e){
        if ( !this.visible() ) return ;
        $(this.id).removeClassName( 'focus' );
    },
    visible : function(){
        return this.element ? this.element.type != 'hidden' : false;
    },
    select : function (){
        try {
            this.element.focus();
            this.element.select();
        } catch(e){};
    },
    invalido: function(){
        var line = this.line;
        this.element.removeClassName('valido').addClassName('invalido');
        if ( line ) {
            line.removeClassName('valido').addClassName('invalido');
            if ( ! this.help ) return ;
            if ( ! this.div_help ){
                this.div_help = $(this.help_id)
                    ? $(this.help_id)
                    : line.appendChild(new Element( 'div', { id : this.help_id , className : 'help'} ))
                          .hide().update(this.help);
            }
            this.div_help.show() ;
        }
    },
    valido: function(){
        var line = this.line;
        this.element.removeClassName('invalido').addClassName('valido');
        if ( line ) {
            line.addClassName('valido').removeClassName('invalido');
            if (this.div_help) this.div_help.hide();
        }
    },
    add_validacion : function(fn){
        this._validacion_especiales.push( fn.bind(this) );
    },
    validar_especial : function(){
        if ( this._validacion_especiales.length == 0 )
            return true;

        return this._validacion_especiales
           .invoke('call')
           .findAll(function(valida){ return valida == false; })
           .length == 0;
    },
    validar : function() {
        var err = 0;
        var valida = true;
        if ( ! this.element.disabled && (this.required || this.tiene_valor()) ){
            if (valida && !this.validar_requerido()   ){err = 1; valida = false; }
            if (valida && !this.valida_tipo_dato()    ){err = 2; valida = false; }
            if (valida && !this.validar_length()      ){err = 3; valida = false; }
            if (valida && !this.validar_especial()    ){err = 4; valida = false; }
        }
        this.err = err;
        return valida ;
    },
    longitud : function (){
        return this.value().length;
    },
    tiene_valor : function (){
        return this.value() ? !! this.value().length : 0;
    },
    validar_length : function() {
        return (Object.isUndefined(this.minlength) || !this.minlength || this.longitud() >= this.minlength)
            && (Object.isUndefined(this.maxlength) || this.maxlength == 0 || this.longitud() <= this.maxlength)
    },
    valida_tipo_dato : function(){ return true },
    validar_requerido : function(){
        return !(this.required && ! this.tiene_valor() );
    },
    value : function (){
        return this.element.value;
    },
    set_value : function(value){
        this.element.value = value;
    },
    enable : function(){
        try{ this.element.enable() } catch(e){};
        var arr = this.element.select('input,select,textarea');
        if (arr) arr.invoke('enable');
    },
    disable : function(){
        try{ this.element.disable() } catch(e){};
        var arr = this.element.select('input,select,textarea');
        if (arr) arr.invoke('disable');

    }
});


Educativa.Control.InputBase = Class.create(Educativa.Control.Base, {});


Educativa.Control.Submit = Class.create(Educativa.Control.Base, {
    focus : function(){ }
});

Educativa.Control.Text = Class.create(Educativa.Control.Base, {
    initialize : function($super, options ){
        $super(options);
        if( options.prompt ) {

            this.set_prompt( options.prompt );
        }


    },

    _prepareValue : function() {
        if ( this.element.readAttribute( 'prompt' ) )
            this.element.value = ''
    },
    _initPrompt : function(){
        this.form.observe('submit', this._prepareValue.bind(this) );
    },
    set_prompt : function(text) {
        var e = this.element;
        if( null !== text ) {

            $ready( this._initPrompt.bind(this) );

            this.prompt = text;
            if( e.value == '' ) {
                e.writeAttribute( 'prompt', true );
            }
            else {
                e.writeAttribute( 'prompt', false);
            }

            e.observe( 'focus', function(){
                if ( e.readAttribute( 'prompt' ) ) {
                    this.element.value='';
                    this.element.removeClassName('showPrompt');
                }

                }.bind(this)
            ).observe( 'blur', function(){
                if ( e.readAttribute( 'prompt' ) ) {
                    this.element.value=this.prompt;
                    this.element.addClassName('showPrompt');
                }
            }.bind(this)
            ).observe( 'change', function(){
                this.element.writeAttribute( 'prompt', this.element.value == '' );
            }.bind(this)
            )
        }
    },
    _promptChange : function(){
        var e = this.element;
        if (e.value == '' || e.value == this.prompt ){
            e.addClassName('noValue');
            e.value = this.prompt;
        }
        else {
            e.addClassName('noValue');
        }

    },
    valida_tipo_dato : function( ){
        var validacion = Educativa.Control.Text.Validaciones[this.tipo_dato]
        return ! validacion || validacion( this.value() )
    },
    tiene_valor : function ($super){
        // tiene valor si no hay todos blancos y length > 0
        return ! this.element.readAttribute('prompt')
          && (!! this.value().length)
          && ! this.value().match( /^\s+$/ );
    }
});
Educativa.Control.Text.Validaciones = {
    simple  : function(v){return !v.match(/\r?\n/m)                },
    usuario : function(v){return  v.match(/^[\w\.]+$/)             },
    id      : function(v){return !v.match(/\W/)                    },
    email   : function(v){return  Educativa.Utils.is_email( v ) },
    uri     : function(v){return  Educativa.Utils.is_uri  ( v ) },
    sitio   : function(v){return  v.match(/^\[CD\]/i) || Educativa.Utils.is_uri( v )}
};

Educativa.Control.Number = Class.create(Educativa.Control.Base, {
    valida_tipo_dato : function(){
        return this.value().match(this.tipo_dato == 'entero' ? /^\d+$/ : /^([\d\.,-]+)$/);
    },
    tiene_valor : function (){
        // tiene valor si no hay todos blancos y length > 0
        return this.value().length && ! this.value().match( /^\s+$/ );
    },
    longitud : function (){
        return this.value();
    }
} );

Educativa.Control.Password = Class.create(Educativa.Control.Text, {
    valida_tipo_dato : function(){ return true; } //debe existir esta linea para que mantenga foco al validar: uke's hell
});


Educativa.Control.RichText = Class.create(Educativa.Control.Base, {
    visible : function(){ return false },
    value   : function(){

        if(self.tinyMCE && self.tinyMCE != null ) tinyMCE.triggerSave();

        var value = this.element.value;
        return value.match(/\<(iframe|object|img|embed)/i) ? value : value.unescapeHTML();
    },
    valida_tipo_dato : function($super){
        v = $super();

        if ( v && this.validation_re ){
            if(self.tinyMCE && self.tinyMCE != null ) tinyMCE.triggerSave();
            var re = new RegExp(this.validation_re,'ig');
            v = re.test( this.element.value );
        }
        return v;
    },
    isVisible   : function() {
        return true
    },
    tiene_valor : function (){

        // tiene valor si no hay todos blancos y length > 0
        return this.value().length && ! this.value().match( /^(&nbsp;|[\s\n\r])*$/ );
    },
    focus : function(){
        tinyMCE.execCommand('mceFocus', false, this.id);
    },
    select : function (){
        tinyMCE.execCommand('mceFocus', false, this.id);
    }
});

Educativa.Control.Select = Class.create(Educativa.Control.Base, {
    tiene_valor : function (){
        return this.value().length && ! this.value().match( /^\s+$/ );
    }
});

Educativa.Control.RadioGroup = Class.create(Educativa.Control.Base, {
    options : function()
    {
        return this.element.select('[type="radio"]')
    },
    value : function (){
        var it = this.options().find(function(e){return e.checked });
        return it ? it.value : null;
    },
    visible: function(){ return false }
});

Educativa.Control.CheckGroup = Class.create(Educativa.Control.Base, {
    value : function(){
        return this.element.select('[type="checkbox"]')
            .findAll(function(e){return e.checked })
            .map(function(e){ return e.value} )
    },
    visible: function(){ return false }
});

Educativa.Control.SelectMultiple = Class.create(Educativa.Control.Base, {
    value : function(){
        return $F(this.name);
    }
});

Educativa.Control.File = Class.create(Educativa.Control.Base, {
    valida_tipo_dato : function(){
        var val = this.value().toLowerCase();


        if( val.match(';')  ) return false;

        function iterator (ext){
            return val.match( '\.' + ext.toLowerCase() + '$' );
        }
        if ( this.permitir.length > 0 ){
            return this.permitir.select( iterator ).length;
        } else if ( this.denegar.length > 0 ){
            return this.denegar.reject( iterator ).length;
        } else {
            return true;
        }
    },
    validar_length : function() {return true}
});



Educativa.Control.MantenerQuitarArchivo = Class.create(Educativa.Control.RadioGroup,
{
    initialize : function($super, options )
    {
        $super(options);
        this.file = $( options.file ).E();
        var opt = this.options().invoke('observe','click',
            this._requerir_file.bindAsEventListener(this));

        var a = this.element.select('a').first();
        if (a) a.observe('click', this.previsualizar.bindAsEventListener(this));

        if ( opt.length > 0)
        {
            this.file.disable();
            this.file.required = false
        }
        else
        {
            this.file.enable();
        }

    },
    previsualizar : function(event)
    {
        event.stop();
        var ele = event.element();
        var href = ele.href;
        Educativa.Popup.open( {
            url      : href,
            name     : this.id,
            width    : 640,
            height   : 400,
            toolbar  : false,
            depend   : true
        } );


    },
    _requerir_file : function(event)
    {
        (this.file.required = event.element().value == 2)
            ? this.file.enable()
            : this.file.disable();
    },

    value : function ($super){
        return this.options().length > 0 ? $super() : 2;
    },
    tiene_valor : function ($super){
        return this.options().length > 0 ? $super() : 2;
    },

    validar : function($super) {
        if ( ("input[name='" + this.id + "']").length == 1
            || ("input[name='" + this.id + "'][checked='checked'][value='2']").length == 1 ){
            return this.file.validar();
        }else{
            return $super();
        }
    }
});

Educativa.Control.DynForm = Class.create(Educativa.Control.Base, {
    initialize : function($super, options )
    {
        $super(options);
        var t = this;
        DynForm.instance.onQuestionAdded = function() {
            t.valido();
        };
    },
    validar : function ($super){
        if ( ql.toFormInput(this.form.id, "encuestas_preguntas") )
            return true;
        return false;
    }
});

// Parametros obligatorios:
//    trigger    : 'agregar_curso_button', //id del elemento que dispara la ventana
//    container  : 'cursos_rows',          // id del elemento en donde se insertan
//    ajax_url   : '?wAccion=ajax_cursos_list&id_encuesta=$e_id' /url de donde se toman los elementos
// Parametros opcionales:
//    page_limit : 10,
//    className  : 'list_select_dialog',
Educativa.Control.ListSelectDialog = Class.create( Educativa.ListSelectDialog ,{

    initialize : function( $super, args) {

        var options = {
            container : null,
            className : 'ListSelectDialog',
            void_list_message : Educativa.Dict.NO_EXISTEN_CURSOS_DISPONIBLES.capitalize(),
            offsetLeft: $(args.trigger).getWidth()+10,
            offsetTop : -80,
            title     : 'asociar'
        };

        Object.extend( options, args); //para pisar los defaults

        $super( options );

    },

    asociar_item: function(arg){
        var obj = arg.item;

        /////////////////////////////////
        // boton para desasociar items //
        /////////////////////////////////
        var d_button = new Element('a',{ className: 'list_select_delete_button' }).update('');
        //activamos o desactivamos la posibilidad de desasociar el curso
        if( obj.realizaciones ) d_button.addClassName('list_select_delete_button_desactivado');
        else                  d_button.addClassName('list_select_delete_button_activo');

        ///////////////////////////////////////////////
        // coloreamos de acuerdo a si es par o impar //
        ///////////////////////////////////////////////
        var index = arg.index;  // indice de la fila
        if( index == null ){
            index = $A(this.lista).findAll(function(obj){ return obj.asociado == 1 }).size();
        }
        var attrs = { className: ( (index % 2) ?'': 'fila_impar')  };

        //Si el grupo se encuentra inactivo le aplicamos class grupo_inactivos_control.
        if (!obj.estado) attrs = { className: 'grupo_inactivos_control'};

        ///////////////////////////////
        // creamos la fila a agregar //
        ///////////////////////////////
        var row = new Element('tr');

        for( var i=0; i < this.headers.length ; ++i){
            var  column_def =  this.headers[i];
            row.insert(
                new Element('td', attrs).insert(
                    new Element('span').update(obj[column_def.key])
                )
            );
        }

        row.insert(
                new Element('td', attrs).insert(
                  new Element('div',{className: 'list_select_delete_button_c' }).update(' ')
                      .insert( d_button)
                )
        );

        obj.imagen = row;

        $(this.container).insert(row);


        obj.asociado = 1;
        this.draw_items_list();

        //cerramos la ventana en caso de que no queden mas cursos
        if(  $A(this.lista).findAll(function(obj){ return obj.asociado == 0 }).size() == 0 ){
            this.menu.hide();
        }

        //evento de desasociar curso
        if( ! obj.realizaciones ) d_button.observe('click', this.desasociar_item.bind(this,{item: obj}) );

    },

    desasociar_item: function(arg){
        var obj = arg.item;
        obj.asociado = 0;
        obj.imagen.remove();
        this.draw_items_list();
    },

    toFormInput: function(formId, inputName){
        var frm = $(formId);
        $$('.'+inputName+'_class').each(function(e){
            e.remove();
        });
        $A(this.lista).findAll(function(obj){ return obj.asociado == 1 }).each( function (obj) {
            frm.insert(new Element('input',{
                className: inputName+'_class',
                name  : inputName,
                value : Object.toJSON({
                    id: obj.id
                }),
                type  : 'hidden'
            }));
        });
        return true;

    }

});


// Parametros obligatorios:
//    trigger    : 'agregar_curso_button', //id del elemento que dispara la ventana
//    container  : 'cursos_rows',          // id del elemento en donde se insertan
//    ajax_url   : '?wAccion=ajax_cursos_list&id_encuesta=$e_id' /url de donde se toman los elementos
// Parametros opcionales:
//    page_limit : 10,
//    className  : 'list_select_dialog',
//    maxAllowed : cant max de items que se pueden seleecionar, si no se pasa es ilimitado
//    mostrar_busqueda: muestra un cuadro de busqueda para filtrar los grupos
Educativa.Control.DoubleList = Class.create({

    initialize : function( args ) {

        var cont = $(args.container);
        
        this.mostrar_busqueda = args.mostrar_busqueda || 0;

        cont.update( );
        cont.insert( new Element('div', {'id': args.id + '_left',
                                         'class' : 'double_list_container'}
        ));
        cont.insert( this._makeButtons(args.urlImg) );
        cont.insert( new Element('div', {'id': args.id ,
                                         'class' : 'double_list_container'}
        ));

        this.list_left = new DynListControl({
            target: args.id + '_left',
            name: args.id + '_left',
            onDblClick : this.onLeftItemClick.bind(this),
            double_control : this,
            sortable: !args.no_sort,
            label: Educativa.Dict.DISPONIBLES.capitalize(),
            search: args.mostrar_busqueda || 0
        });
        this.list_right = new DynListControl({
            target: args.id + '',
            name: args.id + '',
            onDblClick : this.onRightItemClick.bind(this),
            double_control : this,
            sortable: !args.no_sort,
            label: Educativa.Dict.SELECCIONADOS.capitalize(),
            search: args.mostrar_busqueda || 0
        });
        if(args.maxAllowed) this.max_allowed = args.maxAllowed;

        this.list_right.addItem(args.selected);
        this.list_left.addItem(args.items);

        this.list_right.set_sortable(true);
        this.list_left.set_sortable(true);

        Event.observe(this.list_right.list_element, 'keydown',
            this.onRightListKeyDown.bindAsEventListener(this));
        Event.observe(this.list_left.list_element, 'keydown',
            this.onLeftListKeyDown.bindAsEventListener(this));

        this.onChange = args.onChange;

        $(args.id).educativa_control = this;
    },
    getSelected : function() {
        return this.list_right.items.map(function(itm){return itm.get('value')});
    },
    toRight : function ( itm ) {
        if (!itm) return;
        if( !this.max_allowed || this.list_right.items.size() < this.max_allowed ){
            
            var hidden = (itm.get('_htmlElement').getStyle('display') == 'none');
            if (hidden) return;

            var newitem = itm.clone();
            this.list_right.addItem( newitem );
            this.list_left.selectRel(itm,1, true);
            this.list_left.removeItem(itm);
            this.list_right.selectItem( newitem );
            if (this.onChange) this.onChange(this);
        }else{
            alert(Educativa.Dict.translate('NO_SE_PUEDEN_SELECCIONAR_MAS_DE_N_ELEMENTOS').interpolate({ cant: this.max_allowed }).capitalize());
        }

    },
    toLeft : function ( itm ) {
        if (!itm) return;
        
        var hidden = (itm.get('_htmlElement').getStyle('display') == 'none');
        if (hidden) return;
        
        var newitem = itm.clone();
        this.list_left.addItem( newitem );
        this.list_right.selectRel(itm,1, true);
        this.list_right.removeItem(itm);
        this.list_left.selectItem( newitem );
        if (this.onChange) this.onChange(this);
    },
    onLeftItemClick : function (ev, itm) {
        this.toRight(itm);
    },
    onRightItemClick : function (ev, itm) {
        this.toLeft(itm);
    },
    onLeftBtnClick : function (ev) {
        var itm = this.list_right.getSelected();
        if (itm) this.toLeft( itm );
    },
    onRightBtnClick : function (ev) {
        var itm = this.list_left.getSelected();
        if (itm) this.toRight( itm );
    },
    onLeftBtnAllClick : function( ev ) {
        var self = this;
        this.list_right.getAll().each( function(i) {
            self.toLeft( i );
        }, this );
    },
    onRightBtnAllClick : function( ev ) {
        var self = this;
        this.list_left.getAll().each( function(i) {
            self.toRight( i );
        }, this );
    },
    onLeftListKeyDown : function (ev) {
        if (ev.keyCode == 39) { // right arrow
            this.toRight(this.list_left.itemSelected);
            return 0;
        } else if (ev.keyCode == 37 && this.list_right.itemSelected) { // left arrow
            this.toLeft(this.list_right.itemSelected);
            return 0;
        }
    },
    onRightListKeyDown : function (ev) {
        if (ev.keyCode == 37) { // left arrow
            this.toLeft(this.list_right.itemSelected);
            return 0;
        } else if (ev.keyCode == 39 && this.list_left.itemSelected) { // right arrow
            this.toRight(this.list_left.itemSelected);
            return 0;
        }
    },
    _makeButtons : function (url_img) {
        var cont_class = this.mostrar_busqueda ? 'dynlist_btn_container con_busqueda' : 'dynlist_btn_container';

        var cont          = new Element('div', {'class' : cont_class});
        var btn_right_all = new Element('a', {'class' : 'dynlist_btn', href: 'javascript: void(0)'} ).update( '&gt;&gt;' );
        var btn_right     = new Element('a', {'class' : 'dynlist_btn', href: 'javascript: void(0)'} ).update( '&gt;'  );
        var btn_left      = new Element('a', {'class' : 'dynlist_btn', href: 'javascript: void(0)'} ).update( '&lt;'  );
        var btn_left_all  = new Element('a', {'class' : 'dynlist_btn', href: 'javascript: void(0)'} ).update( '&lt;&lt;' );

        Event.observe( btn_right_all, 'click', this.onRightBtnAllClick.bindAsEventListener(this) );
        Event.observe( btn_right,     'click', this.onRightBtnClick.bindAsEventListener(this) );
        Event.observe( btn_left,      'click', this.onLeftBtnClick.bindAsEventListener(this) );
        Event.observe( btn_left_all,  'click', this.onLeftBtnAllClick.bindAsEventListener(this) );
        
        cont.insert( btn_right_all );
        cont.insert( btn_right );
        cont.insert( btn_left );
        cont.insert( btn_left_all );

        return cont;
    }

});

Educativa.Control.AlphabeticDoubleList = Class.create( Educativa.Control.DoubleList, {
    initialize : function( $super, args ) {
        $super( args );
        var cont = $(args.container);

        cont.update( );
        cont.insert( new Element('div', {'id': args.id + '_left',
                                         'class' : 'double_list_container'}
        ));
        cont.insert( this._makeButtons(args.urlImg) );
        cont.insert( new Element('div', {'id': args.id ,
                                         'class' : 'double_list_container'}
        ));

        this.list_left = new AlphabeticDynListControl({
            target: args.id + '_left',
            name: args.id + '_left',
            onDblClick : this.onLeftItemClick.bind(this),
            double_control : this,
            sortable: !args.no_sort,
            label: Educativa.Dict.DISPONIBLES.capitalize()
        });
        this.list_right = new AlphabeticDynListControl({
            target: args.id + '',
            name: args.id + '',
            onDblClick : this.onRightItemClick.bind(this),
            double_control : this,
            sortable: !args.no_sort,
            label: Educativa.Dict.SELECCIONADOS.capitalize()
        });

        if(args.maxAllowed) this.max_allowed = args.maxAllowed;

        this.list_right.addItem(args.selected);
        this.list_left.addItem(args.items);

        this.list_right.set_sortable(true);
        this.list_left.set_sortable(true);

        Event.observe(this.list_right.list_element, 'keydown',
            this.onRightListKeyDown.bindAsEventListener(this));
        Event.observe(this.list_left.list_element, 'keydown',
            this.onLeftListKeyDown.bindAsEventListener(this));

        this.onChange = args.onChange;

        $(args.id).educativa_control = this;

    }

});

/*******************************
 *** Educativa::Control::Tag ***
 *******************************/

Educativa.Control.Tag = Class.create(Educativa.Control.Base, {

    initialize : function( $super, options ){
        $super(options);

        //console.dir( this.tags.evalJSON() );
        this.dialog = new Educativa.Control.Tag.SelectDialog({
            trigger   : this.id+'_trigger',
            container : this.id+'_container',
            lista     : this.tags.evalJSON(),
            draggable : 1,
            title     : 'ETIQUETAS'.term().capitalize(),
            tagControlClass: this.className
        });

        $(this.form_id).observe('submit', this.dialog.toFormInput.bindAsEventListener(
            this.dialog, this.form_id, this.name
        ));
    }

});

// Parametros obligatorios:
//    trigger    : 'agregar_curso_button', //id del elemento que dispara la ventana
//    container  : 'cursos_rows',          // id del elemento en donde se insertan
//    lista      : []
// Parametros opcionales:
//    page_limit : 10,
//    className  : 'list_select_dialog',
Educativa.Control.Tag.SelectDialog = Class.create( Educativa.ListSelectDialog ,{

    estado_input: null, // posibles valores ( null | editando )

    initialize : function( $super, args) {

        var options = {
            container : null,
            className : 'TagSelectDialog',
            void_list_message : 'NO_HAY_ETIQUETAS_DEFINIDAS'.term().capitalize(),
            offsetTop : -100,
            offsetLeft: 70,//$(args.trigger).getWidth()+10,
            tagControlClass: 'tagControlClass', //se pisa
            empty_body: 0,
            readonly: 0
        };
        this.is_backend = $$('body').first().hasClassName('backend');

        Object.extend( options, args); //para pisar los defaults

        $super( options );

        if(  $A(this.lista).findAll(function(obj){ return obj.asociado == 0 }).size() == this.lista.length )
            this.empty_body_message();

        if( ! this.readonly ){
            this.input = new Element('input',
                {type: 'text', value: 'NUEVA_ETIQUETA'.term().capitalize()+'...', className: this.className +'-input-text'}
            );
            this.input_button = new Element('input',
                {type: 'button', value: 'AGREGAR'.term().capitalize(), className: this.className +'-input-button'}
            );
            this.menu.element.insert( { top:
                new Element('div',{ type: 'text', className: this.className+'-input' } )
                    .insert( this.input )
                    .insert( this.input_button )
            });
        }

        if( !this.readonly ){
            this.input.observe('focus', this.on_input_edit.bindAsEventListener(this) );
            this.input.observe('keypress', this.on_input_keypress.bindAsEventListener(this) );
            this.input_button.observe('click', this.add_tag.bind(this) );
        }

        this.menu.b_close.observe('click', this.reset_input.bindAsEventListener(this) );
    },

    asociar_item: function(arg){
        var obj = arg.item;

        // boton para desasociar items //
        var d_button = new Element('a',{
            className: this.tagControlClass+'-borrar',
            title: 'RETIRAR_ETIQUETA'.term().capitalize()
        }).update('');

        // creamos la tag a agregar //
        obj.imagen = new Element('span',{ className: this.tagControlClass })
                      .update( obj.nombre )
                      .insert( d_button   );

        if( this.empty_body ){
            $(this.container).update('');
            this.empty_body = 0;
        }

        $(this.container).insert( obj.imagen );

        obj.asociado = 1;
        this.render();

        //cerramos la ventana en caso de que no queden mas cursos
        if(  $A(this.lista).findAll(function(obj){ return obj.asociado == 0 }).size() == 0 ){
            this.menu.hide();
        }
        //evento de desasociar curso
        d_button.observe('click', this.desasociar_item.bindAsEventListener(this,{item: obj}) );

        $(this.container).fire('TagSelectDialog::change');
    },

    desasociar_item: function(e, arg){
        e.stop();
        var obj = arg.item;
        obj.asociado = 0;
        obj.imagen.remove();
        this.render();
        $(this.container).fire('TagSelectDialog::change');
    },

    toFormInput: function( e, formId, inputName){
        var frm = $(formId);
        $$('.'+inputName+'_class').each(function(e){
            e.remove();
        });
        $A(this.lista).findAll(function(obj){ return obj.asociado == 1 || obj.nuevo == 1 }).each( function (obj) {
            var json_obj = Object.clone(obj);
            delete json_obj.imagen;
            frm.insert(new Element('input',{
                className: inputName+'_class',
                name  : inputName,
                value : Object.toJSON( json_obj ),
                type  : 'hidden'
            }));
        });
        return true;

    },
    on_input_edit: function(){
        if( ! this.estado_input ){ //no editando
            this.input.value = '';
            this.input.setStyle({color: 'black'});
            this.estado_input = 'editando';
        }
    },
    on_input_keypress: function(e){
        if (e.keyCode == Event.KEY_RETURN) {
            this.add_tag();
        }
    },
    reset_input: function(){
        this.input.value = 'NUEVA_ETIQUETA'.term().capitalize()+'...';
        this.input.setStyle({color: '#c8c8c8'});
        this.estado_input = null;
    },

    add_tag: function(  ){
        var tagnames = this.input.value.split(',');
        for( var i=0; i<tagnames.length; i++){
            var tagname = tagnames[i].strip().stripTags();
            if( this.estado_input == null || ! tagname ) return;
            var t = this.clean( tagname.toLowerCase() );
            var existe = $A(this.lista).find(function(e){
                var n = this.clean( e.nombre.toLowerCase() );
                return ( t == n );
            }, this );
            if( existe ){
                alert( 'ETIQUETA_EXISTENTE'.term().capitalize() );
                continue;
            }
            var obj = { id: 'new_'+this.lista.length + 1, nombre: tagname, asociado: 1, nuevo: 1};
            this.lista.push( obj );
            this.asociar_item( { item: obj });
        }
        this.menu.hide();
        this.reset_input();
    },

    clean : function( e ) {
        var t = e;

        t = t.replace( /[\u00e0|\u00e1|\u00e2|\u00e3|\u00e4|\u00e5|\u00c0|\u00c1|\u00c2|\u00c3|\u00c4|\u00c5]/g, 'a' );
        t = t.replace( /[\u00e8|\u00e9|\u00ea|\u00eb|\u00c8|\u00c9|\u00ca|\u00cb]/g, 'e' );
        t = t.replace( /[\u00ec|\u00ed|\u00ee|\u00ef|\u00cc|\u00cd|\u00ce|\u00cf]/g, 'i' );
        t = t.replace( /[\u00f2|\u00f3|\u00f4|\u00f5|\u00f6|\u00d2|\u00d3|\u00d4|\u00d5|\u00d6]/g, 'o' );
        t = t.replace( /[\u00f9|\u00fa|\u00fb|\u00fc|\u00d9|\u00da|\u00db|\u00dc]/g, 'u' );

        return t;
    },

    empty_body_message: function(){
        this.empty_body = 1;
        $(this.container).update( new Element('span').update('NO_HAY_ETIQUETAS_DEFINIDAS'.term().capitalize()) );
    },

    item_decorator: function( element, obj ){
        var b = new Element('a',{
            className: this.className+'-eliminar_item',
            title: 'ELIMINAR_ETIQUETA'.term().capitalize()
        });
        element.firstDescendant().writeAttribute({title:'CLICK_PARA_AGREGAR'.term().capitalize()});
        element.insert( b);
        b.observe('click',this.eliminar_item.bindAsEventListener(this, obj));
    },

    eliminar_item: function(e, obj){
        e.stop();

        if( ! confirm('ETIQUETAS_ADVERTENCIA_ELIMINAR'.term()) ){
            return;
        }

        //esto esta muy mal, el script al qe consulta deberia pasarse como parametro
        var cgi = this.is_backend ? 'administracion/admin_evaluaciones_items.cgi' : "evaluaciones_items.cgi";

        if( ! obj["nuevo"] ){
            new Ajax.Request( url_dir + cgi ,{
                method: "get",
                parameters: {
                    wAccion: 'delete_tag',
                    id: obj.id,
                    id_curso: id_grupo
                },
                onSuccess: function (transport) {

                    if( ! transport.responseText.match(/^OK/) ){
                        alert('Error eliminando ');
                        return;
                    }
                },
                onFailure: function(transport){
                    alert('Error eliminando ');
                }
            });
        }

        var index = $A(this.lista).indexOf(obj);
        this.lista.splice(index,1);
        this.render();
    },
    get_ids_asociados: function(){
        return $A(this.lista).findAll(function(obj){ return obj.asociado == 1;}).map(function(e){ return e.id });
    },
    get_palabras_asociadas: function(){
        return $A(this.lista).findAll(function(obj){ return obj.asociado == 1;}).map(function(e){ return e.nombre });
    },
    load_ids_asociados: function(ids){
        $A(this.lista).each(function(e){
            if( ids.include( e.id ) ) e.asociado = 1;
            else                      e.asociado = 0;
        });
        this.empty_body_message();
        this.load_items();
    },
    empty: function(){
        $A(this.lista).each(function(e){ e.asociado = 0} );
        this.empty_body_message();
        this.load_items();
    },
    add_tag_to_list: function(tag){
        $(this.lista).push( tag );
        this.render();
    }

});

Educativa.Control.Tag.SelectDialogReadonly = Class.create( Educativa.Control.Tag.SelectDialog, {
    initialize : function( $super, args) {
        var options = {
            readonly: 1
        };
        Object.extend( options, args);
        $super( options );
    },
    reset_input: function(){},
    item_decorator: function( element, obj ){
        element.firstDescendant().writeAttribute({title:'CLICK_PARA_AGREGAR'.term().capitalize()});
    }
});




