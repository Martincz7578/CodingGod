<?php
if(isset($_POST['theme'])){
        $theme = $_POST['theme'];
        setcookie('theme', $theme, time()+3600*24*30);
    }else{
        $theme = $_COOKIE['theme'] ?? 'light';
    }
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodingGod</title>
    <link rel="stylesheet" href="/game.css">
</head>
<body>
    <header>
        <select name="theme" id="theme">
            <option value="light"<?php if ($theme == 'light') echo ' selected'; ?>>Light</option>
            <option value="dark"<?php if ($theme == 'dark') echo ' selected'; ?>>Dark</option>
        </select>
        <span id="raw"></span>
        <span id="processed"></span>
        <span id="money"></span>
        <span id="food"></span>
        <span id="priceTag"></span>
    </header>
    <main>
        <canvas id="fg" width="800" height="600"></canvas>
        <div class="modal">
            <div class="mheader"><h3>Notice</h3></div>
            <div class="mcontent"><p id="content"></p></div>
            <div class="mfooter"><button id="mclose"></button></div>
        </div>
        <canvas id="pbg" width="800" height="600"></canvas>
        <canvas id="bg" width="800" height="600"></canvas>
    </main>
    <img src="/imgs/depot.jpg" alt="" id="depot">
    <img src="/imgs/factory.jpg" alt="" id="factory">
    <img src="/imgs/farm.jpg" alt="" id="farm">
    <img src="/imgs/house.jpg" alt="" id="house">
    <img src="/imgs/store.jpg" alt="" id="store">
</body>
<script type="module" src="/Scripts/game.js"></script>
<script type="module" src="/Scripts/economy.js"></script>
</html>