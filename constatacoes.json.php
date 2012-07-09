<?php

if($_REQUEST['data'] == 'geral') {
	$csv = 'http://docs.google.com/spreadsheet/pub?key=0Avi2PVZYFw_2dGdhcFV3SGNpb01BQmN6aHpWSVBOcXc&single=true&gid=0&output=csv';
} elseif($_REQUEST['data'] == 'tipo') {
	$csv = 'https://docs.google.com/spreadsheet/pub?key=0Avi2PVZYFw_2dGdhcFV3SGNpb01BQmN6aHpWSVBOcXc&single=true&gid=5&output=csv';
} elseif($_REQUEST['data'] == 'programa') {
	$csv = 'https://docs.google.com/spreadsheet/pub?key=0Avi2PVZYFw_2dGdhcFV3SGNpb01BQmN6aHpWSVBOcXc&single=true&gid=4&output=csv';
} elseif($_REQUEST['data'] == 'cidade') {
	$csv = 'https://docs.google.com/spreadsheet/pub?key=0Avi2PVZYFw_2dGdhcFV3SGNpb01BQmN6aHpWSVBOcXc&single=true&gid=3&output=csv';
}

$fp = @fopen($csv, 'r');

$headers = fgetcsv($fp, 2048);

$data = array();
while ($row = fgetcsv($fp, 2048)) {
	$item = array();
	foreach ($row as $key => $cell) {
		$item[$headers[$key]] = $cell;
	}
	$data[] = $item;
}

header('Content-Type: application/json');
echo json_encode($data);

?>