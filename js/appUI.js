//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let selectedCategory = null;
Init_UI();

$('.dropdown-menu').click(function(e) {
    e.stopPropagation();
});

function Init_UI() {
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de favoris</h2>
                <hr>
                <p>
                    Petite application de gestion de favoris.
                </p>
                <p>
                    Auteur: Alexis Perreault
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderBookmarks() {
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let bookmarks = await Bookmarks_API.Get();
    let categories = []
    eraseContent();

    
    if (bookmarks !== null) {
        bookmarks.forEach(bookmark => {
            if(selectedCategory == null)
                $("#content").append(renderBookmark(bookmark));

            else if(bookmark.Category == selectedCategory){
                $("#content").append(renderBookmark(bookmark));
            }
            //adding categories
            if(!categories.includes(bookmark.Category))
                categories.push(bookmark.Category)
        });
        restoreContentScrollPosition();
        renderDropDownMenu(categories)
        

        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editBookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deleteBookmarkId")));
        });
        $(".bookmarkRow").on("click", function () { 
            window.location = $(this).find("#bookmarkUrl").val()
        })    
    } else {
        renderError("Service introuvable");
    }
    
}
function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreateBookmarkForm() {
    renderBookmarkForm();
}
async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark = await Bookmarks_API.Get(id);
    if (bookmark !== null)
        renderBookmarkForm(bookmark);
    else
        renderError("Favoris introuvable!");
}
async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await Bookmarks_API.Get(id);
    eraseContent();
    if (bookmark !== null) {
        $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
        <div class="bookmarkContainer">
            <div class="bookmarkLayout">
                <div class="bookmarkHeader">
                    <img src="https://www.google.com/s2/favicons?domain=${bookmark.Url}&sz=32">
                    <span class="bookmarkTitle">${bookmark.Title}</span>
                </div>
                <span class="bookmarkCategory">${bookmark.Category}</span>
            </div>
        </div>
    </div>        
            <br>
            <input type="button" value="Effacer" id="deleteBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deleteBookmark').on("click", async function () {
            showWaitingGif();
            let result = await Bookmarks_API.Delete(bookmark.Id);
            selectedCategory = null
            if (result)
                renderBookmarks();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderBookmarks();
        });
    } else {
        renderError("Favoris introuvable!");
    }
}
function newBookmark() {
    bookmark = {};
    bookmark.Id = 0;
    bookmark.Title = "";
    bookmark.Url = "";
    bookmark.Category = "";
    return bookmark;
}
function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    let faviconUrl = "bookmark-logo.svg";
    if (create) bookmark = newBookmark();
    else  faviconUrl = `https://www.google.com/s2/favicons?domain=${bookmark.Url}&sz=64`

    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <input type="hidden" name="Id" value="${bookmark.Id}"/>
            <img id="bookmarkIcon" src="${faviconUrl}" class="createBookmarkIcon" alt="Icône du favoris">
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control URL"
                name="Url"
                id="Url"
                placeholder="https://www.exemple.com"
                required
                RequireMessage="Veuillez entrer un Url" 
                InvalidMessage="Veuillez entrer une Url valide"
                value="${bookmark.Url}" 
            />
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control Alpha"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie" 
                InvalidMessage="La catégorie comporte un caractère illégal"
                value="${bookmark.Category}"
            />
            
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark = getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await Bookmarks_API.Save(bookmark, create);
        if (result)
            renderBookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
    $('#Url').on("change", () => {
        let site = $("#Url").val();
        if (site != '')
            $("#bookmarkIcon").attr("src", `https://www.google.com/s2/favicons?domain=${site}&sz=64`);
        else $("#bookmarkIcon").attr("src", "bookmark-logo.svg")
    })
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderBookmark(bookmark) {
    return $(`
     <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
     <input type="hidden" value="${bookmark.Url}" id="bookmarkUrl">
        <div class="bookmarkContainer noselect">
            <div class="bookmarkLayout">
                <div class="bookmarkHeader">
                    <img src="https://www.google.com/s2/favicons?domain=${bookmark.Url}&sz=32">
                    <span class="bookmarkTitle">${bookmark.Title}</span>
                </div>
                <span class="bookmarkCategory">${bookmark.Category}</span>
            </div>
            <div class="bookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editBookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteBookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}


function renderDropDownMenu(categories){
    $(".dropdown-menu").empty()
    $(".dropdown-menu").append(`<div class="dropdown-item dropdown-category" id="loginCmd">
        ${selectedCategory == null ? '<i class="fa fa-check" style="color:rgb(0, 87, 204);"></i> ' : ''}Toutes les catégories
        </div>
    <div class="dropdown-divider"></div>`)

    categories.forEach(category => {
        $(".dropdown-menu").append(`<div class="dropdown-item dropdown-category" id="${category.replace(' ','_')}">
        ${category == selectedCategory ? '<i class="fa fa-check" style="color:rgb(0, 87, 204);"></i> ' + category : category} 
    </div>`)
    });
    
    if(categories.length > 0){
        $(".dropdown-item:last").after('<div class="dropdown-divider"></div>')
    }

    $('.dropdown-menu').append(`<div class="dropdown-item" id="aboutCmd">
                        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
                    </div>`)

    $('.dropdown-category').on("click",function() {
        $('.dropdown-category i.fa-check').remove();
        $(this).prepend('<i class="fa fa-check" style="color:rgb(0, 87, 204);"></i>')
        selectedCategory = $(this).text().trim()
        
        if (selectedCategory == "Toutes les catégories")
            selectedCategory = null
        
        renderBookmarks()
    })
    $('#aboutCmd').on("click", function () {
        renderAbout();
        $(".dropdown").click()
    });
}