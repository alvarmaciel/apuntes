/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
Educativa.Aula.FunctionBar = Class.create( Educativa.FunctionBar , {

    onChangeCombo: function( combo , id_curso_actual ) {
        // id_curso_actual contiene el valor seleccionado antes del change
        var value = combo.getValue(); //valor seleccionado
        if( !value ) return ;
        var opcion_seleccionada = combo.selectedIndex;

        if( this.cursos[opcion_seleccionada][3] == 'A' ){
            window.location.href = url_dir+'index.cgi?id_curso='+value+'&id_curso_ant='+id_curso_actual;
            return;
        }

        this.alerta_desactivo();
        combo.setValue(id_curso_actual);

    },

    alerta_desactivo: function() {
        alert("LOGIN_SUSPENDIDO".termcap());
    } ,

    get_nombre_usuario: function(){
        return this.user_nombre_completo;
    } ,

    get_url_logout: function(){
        var id_curso_actual = this.id_curso != 0 ? this.id_curso : null;
        return url_dir + 'acceso.cgi?wAccion=logoff&id_curso=' + id_curso_actual;
    } ,

    render_btn_escritorio: function() {
        if( this.mostrar_link_escritorio && this.logout_multiple && this.id_usuario != '_anonimo' ){
            var link_esc = '';
            if( this.id_curso != 0 ){
                link_esc = url_dir + 'escritorio.cgi?id_curso_ant=' + this.id_curso;
            }else{
                link_esc = url_dir + 'escritorio.cgi';
            }
            this.body.insert(
                new Element('a', {
                    className: 'LinkEscritorio',
                    title: Educativa.Dict.translate('IR_AL_ESCRITORIO').capitalize(),
                    href: link_esc
                }).insert(
                    new Element('a', {
                        className: 'IconoEscritorio',
                        title: Educativa.Dict.translate('IR_AL_ESCRITORIO').capitalize(),
                        href: link_esc // IE no lo toma de arriba
                    })
                ).insert(
                    Educativa.Dict.translate('ESCRITORIO').capitalize()
                )
            );
        }
    } ,

    render_nombre_usuario: function(){
        var nombre_usuario = this.get_nombre_usuario();
        var id_curso_actual = this.id_curso || 0;

        this.nombre_usr_frame = new Element('span', {
            className: 'NombreUser-Frame NombreCompleto'
        }).update( nombre_usuario );

        this.usuario_link_perfil = new Element('a', {
            href: 'personal.cgi?id_curso='+id_curso_actual,
            id: 'usuario_link_perfil',
            className: 'Logout'
        }).insert(this.nombre_usr_frame);

        this.usuario_frame = new Element('span', {
            className: 'Usuario'
        }).insert(this.usuario_link_perfil);

        if ( id_curso_actual != 0 ){
            this.usuario_frame.insert(new Element('span', {
                className: 'NombreUser-Frame'
            }).insert( Educativa.Dict.translate('EN') ) );
        }



        this.body.insert( this.usuario_frame );
    } ,

    render_combo_cursos: function() {
        var id_curso_actual = this.id_curso != 0 ? this.id_curso : null;

        // si no es vista escritorio (hay cursos)
        if( this.cursos.length > 0 ){

            if( this.cursos.length == 1 || !this.logout_multiple || this.id_usuario == '_anonimo' ){

                var id_curso = this.cursos[0][0];
                var nombre;

                this.cursos.each(
                    function(e){
                        var id_curso = e[0];
                        if( id_curso == id_curso_actual)
                            nombre = e[1];
                    }
                );

                this.curso_unico_frame = new Element('span', {
                    className: 'cursoUnico-Frame'
                }).update( nombre );

                this.usuario_frame.insert( this.curso_unico_frame );

            }else{

                //combo de cursos
                this.combo_cursos = new Element('select', {
                    id: 'selector'
                });

                for( var i=0; i<this.cursos.length; i++ ) {
                    var id_curso = this.cursos[i][0];
                    var activo = this.cursos[i][3] == 'A' ? true : false; //indica si el usuario tiene activado el curso
                    var nombre = this.cursos[i][1];
                    var clase = 'opcionCombo';
                    if( id_curso == id_curso_actual ) clase = 'opcionSeleccionada';
                    if( !activo ) clase = 'no-activo';

                    var opcion = new Element('option',{
                       value: id_curso,
                       selected: id_curso == id_curso_actual ? true : false,
                       className: clase
                    }).update(nombre);

                    this.combo_cursos.insert( opcion );
                }

                this.combo_cursos.observe('change', this.onChangeCombo.bind( this, this.combo_cursos, id_curso_actual ) );

                this.combo_cursos_frame = new Element('span', {
                    className: 'comboCursos-Frame'
                });

                this.combo_cursos_frame.insert(this.combo_cursos);

                this.usuario_frame.insert( this.combo_cursos_frame );

            }

        }
    } ,

    render_eims: function() {
        if( Educativa.Eims ) Educativa.Eims.GetInstance().render( this.body )
    } ,

    render_botonera: function(){
        this.render_btn_escritorio();
        this.render_nombre_usuario();
        this.render_combo_cursos();
        this.render_btn_administracion();
        this.render_btn_lc();
        this.render_btn_logout();
        this.render_eims();
    }
});

