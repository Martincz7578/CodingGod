function setTheme(theme: 'light' | 'dark'){
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.cookie = "theme=" + theme + ";path=/;max-age=" + (3600*24*30);
}

function getCookie(name: string){
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

const savedTheme = getCookie('theme') as 'light' | 'dark' | null;
if(savedTheme) setTheme(savedTheme);
else setTheme('light');

document.getElementById('theme')?.addEventListener('change', (event) => {
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    setTheme(current === 'light' ? 'dark' : 'light');
});