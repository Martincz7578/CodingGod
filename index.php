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
    </header>
    <main>
        <canvas id="fg" width="800" height="600"></canvas>
        <canvas id="bg" width="800" height="600"></canvas>
    </main>
</body>
<script src="/Scripts/game.js"></script>
<script src="/Scripts/theme.js"></script>
</html>