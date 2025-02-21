document.addEventListener("DOMContentLoaded", function () {
    const columns = [
        document.querySelector(".column1"),
        document.querySelector(".column2"),
        document.querySelector(".column3"),
        document.querySelector(".column4")
    ];

    const images = [
        { src: "iceland1.jpg", category: "landscape" }, { src: "iceland2.jpg", category: "landscape" }, { src: "iceland3.jpg", category: "landscape" }, { src: "iceland4.jpg", category: "landscape" }, { src: "iceland5.jpg", category: "landscape" },
        { src: "iceland6.jpg", category: "landscape" }, { src: "iceland7.jpg", category: "landscape" }, { src: "iceland8.jpg", category: "landscape" }, { src: "iceland9.jpg", category: "landscape" }, { src: "iceland10.jpg", category: "landscape" },
        { src: "iceland11.jpg", category: "landscape" }, { src: "iceland12.jpg", category: "landscape" }, { src: "iceland13.jpg", category: "landscape" }, { src: "iceland14.jpg", category: "landscape" }, { src: "iceland15.jpg", category: "astro" },
        { src: "iceland16.jpg", category: "astro" }, { src: "iceland17.jpg", category: "astro" }, { src: "iceland18.jpg", category: "astro" }, { src: "iceland18_0.jpg", category: "astro" }, { src: "iceland19.jpg", category: "astro" },
        { src: "iceland20.jpg", category: "landscape" }, { src: "iceland21.jpg", category: "landscape" }, { src: "iceland22.jpg", category: "landscape" }, { src: "iceland23.jpg", category: "landscape" }, { src: "iceland24.jpg", category: "landscape" },
        { src: "iceland25.jpg", category: "landscape" }, { src: "iceland26.jpg", category: "landscape" }, { src: "japan1.jpg", category: "landscape" }, { src: "japan2.jpg", category: "landscape" }, { src: "japan3.jpg", category: "landscape" }, { src: "japan4.jpg", category: "portraits" },
        { src: "japan5.jpg", category: "landscape" }, { src: "japan6.jpg", category: "landscape" }, { src: "japan7.jpg", category: "landscape" }, { src: "japan8.jpg", category: "landscape" }, { src: "japan9.jpg", category: "landscape" }, { src: "japan10.jpg", category: "portraits" },
        { src: "japan11.jpg", category: "portraits" }, { src: "japan12.jpg", category: "landscape" }, { src: "japan13.jpg", category: "landscape" }, { src: "japan14.jpg", category: "landscape" }, { src: "japan15.jpg", category: "landscape" }, { src: "japan16.jpg", category: "portraits" },
        { src: "japan17.jpg", category: "portraits" }, { src: "japan18.jpg", category: "landscape" }, { src: "japan19.jpg", category: "landscape" }, { src: "japan20.jpg", category: "landscape" }, { src: "japan21.jpg", category: "landscape" }, { src: "japan22.jpg", category: "landscape" },
        { src: "japan23.jpg", category: "landscape" }, { src: "japan24.jpg", category: "landscape" }, { src: "japan25.jpg", category: "landscape" }, { src: "japan26.jpg", category: "landscape" }, { src: "japan27.jpg", category: "landscape" }, { src: "japan28.jpg", category: "landscape" },
        { src: "japan29.jpg", category: "landscape" }, { src: "japan30.jpg", category: "landscape" }, { src: "japan31.jpg", category: "landscape" }, { src: "kazakhstan1.jpg", category: "landscape" }, { src: "kazakhstan2.jpg", category: "landscape" },
        { src: "kazakhstan3.jpg", category: "portraits" }, { src: "kazakhstan4.jpg", category: "landscape" }, { src: "kazakhstan5.jpg", category: "landscape" }, { src: "kazakhstan6.jpg", category: "landscape" },
        { src: "kazakhstan7.jpg", category: "landscape" }, { src: "kazakhstan8.jpg", category: "landscape" }, { src: "kazakhstan9.jpg", category: "landscape" }, { src: "kazakhstan10.jpg", category: "landscape" },
        { src: "kazakhstan11.jpg", category: "landscape" }, { src: "kazakhstan12.jpg", category: "landscape" }, { src: "kazakhstan13.jpg", category: "landscape" }, { src: "kazakhstan14.jpg", category: "landscape" },
        { src: "kazakhstan15.jpg", category: "landscape" }, { src: "kazakhstan16.jpg", category: "landscape" }, { src: "kazakhstan17.jpg", category: "landscape" }, { src: "kazakhstan18.jpg", category: "landscape" },
        { src: "kazakhstan19.jpg", category: "landscape" }, { src: "ladakh1.jpg", category: "landscape" }, { src: "ladakh2.jpg", category: "landscape" }, { src: "ladakh3.jpg", category: "portraits" }, { src: "ladakh4.jpg", category: "portraits" },
        { src: "ladakh5.jpg", category: "landscape" }, { src: "ladakh6.jpg", category: "landscape" }, { src: "ladakh7.jpg", category: "landscape" }, { src: "ladakh8.jpg", category: "landscape" }, { src: "ladakh9.jpg", category: "landscape" },
        { src: "ladakh10.jpg", category: "landscape" }, { src: "ladakh11.jpg", category: "portraits" }, { src: "ladakh12.jpg", category: "astro" }, { src: "ladakh13.jpg", category: "astro" }, { src: "mauritius1.jpg", category: "wildlife" },
        { src: "mauritius2.jpg", category: "wildlife" }, { src: "mauritius3.jpg", category: "wildlife" }, { src: "mauritius4.jpg", category: "wildlife" }, { src: "mauritius5.jpg", category: "wildlife" },
        { src: "mauritius6.jpg", category: "wildlife" }, { src: "mauritius7.jpg", category: "wildlife" }, { src: "mauritius8.jpg", category: "wildlife" }, { src: "mauritius9.jpg", category: "wildlife" },
        { src: "rajasthan1.jpg", category: "portraits" }, { src: "rajasthan2.jpg", category: "landscape" }, { src: "rajasthan3.jpg", category: "portraits" }, { src: "rajasthan4.jpg", category: "portraits" },
        { src: "rajasthan5.jpg", category: "portraits" }, { src: "rajasthan6.jpg", category: "portraits" }, { src: "rajasthan7.jpg", category: "portraits" }, { src: "rajasthan8.jpg", category: "portraits" },
        { src: "rajasthan9.jpg", category: "portraits" }, { src: "rajasthan10.jpg", category: "portraits" }, { src: "rajasthan11.jpg", category: "portraits" }, { src: "srilanka1.jpg", category: "landscape" },
        { src: "srilanka2.jpg", category: "landscape" }, { src: "srilanka3.jpg", category: "landscape" }, { src: "srilanka4.jpg", category: "landscape" }, { src: "srilanka5.jpg", category: "wildlife" }, { src: "srilanka6.jpg", category: "landscape" },
        { src: "srilanka7.jpg", category: "portraits" }, { src: "srilanka8.jpg", category: "landscape" }, { src: "srilanka9.jpg", category: "landscape" }, { src: "srilanka10.jpg", category: "landscape" }, { src: "srilanka11.jpg", category: "wildlife" },
        { src: "srilanka12.jpg", category: "wildlife" }, { src: "srilanka13.jpg", category: "wildlife" }, { src: "srilanka14.jpg", category: "wildlife" }, { src: "srilanka15.jpg", category: "wildlife" }, { src: "srilanka16.jpg", category: "wildlife" },
        { src: "srilanka17.jpg", category: "wildlife" }, { src: "srilanka18.jpg", category: "wildlife" }, { src: "srilanka19.jpg", category: "portraits" }, { src: "srilanka20.jpg", category: "portraits" }, { src: "srilanka21.jpg", category: "landscape" },
        { src: "srilanka22.jpg", category: "landscape" }, { src: "srilanka23.jpg", category: "wildlife" }, { src: "srilanka24.jpg", category: "portraits" }, { src: "srilanka25.jpg", category: "portraits" }, { src: "srilanka26.jpg", category: "portraits" },
        { src: "srilanka27.jpg", category: "landscape" }, { src: "srilanka28.jpg", category: "wildlife" }, { src: "srilanka29.jpg", category: "landscape" }
    ];

    // Distribute images into 4 columns
    images.forEach((img, index) => {
        const column = columns[index % 4];
        column.innerHTML += `
            <div class="photo" data-category="${img.category}">
                <img src="images/${img.src}" loading="lazy">
            </div>`;
    });
});