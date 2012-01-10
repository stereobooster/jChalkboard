<?php

$data = @$_REQUEST['data'];
if ($data) {
	list ($mime_type, $data) = explode($data, 'base64,');
	$mime_type = str_replace('data:', '', $mime_type);
	$file = @$_REQUEST['file'];
	if (!$file) {
		$file = str_replace('/', '.', $mime_type);
	}
	@header('Content-type: '.$mime_type);
	@header('Content-Disposition: attachment; filename="'.$file.'"');
	@header('Content-Transfer-Encoding: binary');

	/* The three lines below basically make the download non-cacheable */
	@header('Cache-control: private');
	@header('Pragma: private');
	@header('Expires: Mon, 26 Jul 1997 05:00:00 GMT')
	echo base64_decode($data);
}