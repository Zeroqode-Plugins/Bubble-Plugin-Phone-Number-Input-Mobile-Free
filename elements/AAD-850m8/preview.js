function(instance, properties) {
    const { bubble } = properties;
    const  width  = bubble.width();
    const  height  = bubble.height();

    console.log('width:',  width);

    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.height = "95%";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.overflow = "hidden";

    const container = document.createElement("div");
    container.style.width = (width - 2)+ 'px';
    container.style.height = (height -10) + 'px';
    container.style.backgroundImage = "url('//meta-q.cdn.bubble.io/f1764076251149x680419378703418800/Interfa%C8%9Ba%20telefonului%20%C3%AEntr-un%20design%20pastel.png')";
    container.style.backgroundSize = "cover";
    container.style.backgroundRepeat = "no-repeat";
    container.style.backgroundPosition = "center";
    container.style.border = "1px dashed #ccc";
    container.style.borderRadius = "8px";

    wrapper.appendChild(container);
    instance.canvas.appendChild(wrapper);
}