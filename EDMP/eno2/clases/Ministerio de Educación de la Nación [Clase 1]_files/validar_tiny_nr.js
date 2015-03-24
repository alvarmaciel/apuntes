/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/


function quitar_html_tags(str){

    str = str.replace(/&nbsp;/g,'')
    str = str.replace(/&#160;/g,'')

    var letters = str.split('');
    var estado = ''; //posibles estados: ''|tag|string
    var quote = '';
    var new_str = '';

    // se permite que str sea solo un iframe, un flash, o una imagen
    var allowedTags = 'iframe|object|img|embed';
    var pattern = new RegExp ('<'+ allowedTags + '\.*' + '>');
    if( pattern.test(str) ) return str;

    for ( var j=0; j < letters.length; ++j){
        var c = letters[j];
        switch( estado ){
            case '':
                if( c == '<') estado = 'tag';
                else new_str += c;
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
    return new_str;
}

function check_empty_tiny( element ){

    if(self.tinyMCE && self.tinyMCE != null ) tinyMCE.triggerSave();

    var value = element.value;

    value = quitar_html_tags(value);

    return check_empty( value);

}


