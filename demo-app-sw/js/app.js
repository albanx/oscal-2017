var loader = '<div class="progress"> <div class="indeterminate"></div> </div>';

function getTemplate(url, title, icon) {
    return [
        '<div class="col s6 m6 image-x">',
        '<div class="card">',
        '<div class="card-image">',
        '<img src="' + url + '">',
        '<a class="btn-floating halfway-fab waves-effect save-image red" data-title="' + title + '" data-url="' + url + '"><i class="material-icons">' + icon + '</i></a>',
        '</div>',
        '<div class="card-content">',
        '<p>' + title + '</p>',
        '</div>',
        '</div>',
        '</div>'
    ].join('');
}

function parseImage(photo) {
    var url = 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_q.jpg';
    return getTemplate(url, photo.title, 'star');
}

function doSearch(term) {
    $('#result-container').html(loader);
    var method = 'flickr.photos.search';
    if(!term) {
        method = 'flickr.photos.getRecent';
    }

    $.get('https://api.flickr.com/services/rest/?method='+method+'&per_page=20&api_key=c7d88d47616a479da2cfcd37fb95cffb&text=' + term + '&format=json&nojsoncallback=1').done(function(data) {
        var html = '';
        if(data.photos && data.photos.photo) {
            for(var i = 0; i < data.photos.photo.length; i++) {
                html += parseImage(data.photos.photo[i]);
            }
        }
        $('#result-container').html(html);
    });
}

function saveImage(url, title) {
    try {
        var itemsJson = localStorage.getItem('images') || '[]';
        var items = JSON.parse(itemsJson);
        items.push({
            url: url,
            title: title
        });
        localStorage.setItem('images', JSON.stringify(items));
    } catch(e) {

    }
}

function removeImage(url) {
    try {
        var itemsJson = localStorage.getItem('images') || '[]';
        var items = JSON.parse(itemsJson);

        items = items.filter(function(item) {
            return url !== item.url;
        });

        localStorage.setItem('images', JSON.stringify(items));
    } catch(e) {

    }
}

function loadSavedImages() {
    try {
        var itemsJson = localStorage.getItem('images') || '[]';
        var items = JSON.parse(itemsJson);
        var html = '';
        for(var i = 0; i < items.length; i++) {
            html += getTemplate(items[i].url, items[i].title, 'delete');
        }
        $('#saved-images').html(html);
    } catch(e) {

    }
}

$(document).ready(function() {

    $(".button-collapse").sideNav();


    $('.search-btn').on('click', function() {
        var val = $('#search-input').val();
        doSearch(val);
    });

    $('.reset-btn').on('click', function() {
        $('#result-container').html('');
    });

    $('#result-container').on('click', '.save-image', function() {
        saveImage($(this).data('url'), $(this).data('title'));
    });

    $('#test2').on('click', '.save-image', function() {
        removeImage($(this).data('url'));
        $(this).parents('.image-x').remove();
    });

    doSearch('');

    $('.tabs').tabs({
        onShow: function(tab) {
            if(tab.attr('id') === 'test2') {
                loadSavedImages();
            }
        }
    });
});
