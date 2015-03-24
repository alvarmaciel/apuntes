/********************************************************************************/
/*                                                                              */
/* Plataforma e-ducativa.  Version 7.08.03-64 - Argentina                       */
/*                                                                              */
/* Copyright (c) 1998-2008 de e-ducativa Educación Virtual S.A.                 */
/*                                                                              */
/********************************************************************************/
/* funcion utilizada para ocultar y desplegar menues */	

/*
	Muestra u oculta un objecto segun se encuentre visible u oculto.
	
	\param ob objecto a ocultar/mostrar
	\param img imagen opcional que se desea hacer cambiar cuando se oculte/muestre el objeto
	\param img_cache objeto con las imagenes precargadas para representar el estado del 
	                 objeto en cuestion.
	Ejemplo de como debe inicializarse el objecto img_cache:
	var img_cache = new Object();
	img_cache.oculto = new Image(7,7);
	img_cache.oculto.src = "$ConfigStatic{url_img}flecha_desc.gif";
	img_cache.desplegado = new Image(7,7);
	img_cache.desplegado.src= "$ConfigStatic{url_img}flecha_asc.gif ";
*/

function ocultarDesplegar(ob,img,img_cache){
	if (ob == null )return; 
	if ( ob.style.display == 'none' || ob.style.display == '' ){
		ob.style.display = 'block';
		if( img != null ) img.src = img_cache.desplegado.src;
	}else{ 
		ob.style.display = 'none';
		if( img != null ) img.src = img_cache.oculto.src;
	}
}

