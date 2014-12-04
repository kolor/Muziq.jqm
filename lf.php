<?php

echo file_get_contents("http://www.last.fm/music/".$_GET['q']."/+charts");
