window.moveStick = (id, dx, dy) => {
    const stick = document.getElementById(id);
    if (stick) stick.setAttribute("transform", `translate(${dx}, ${dy})`);
};

window.resetSticks = () => {
    moveStick("leftStick", 0, 0);
    moveStick("rightStick", 0, 0);
};