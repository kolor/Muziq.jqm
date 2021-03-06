var Muziq = new function() {

	/* * 
	 * public methods
	 * @method init(module): runs modules init
	 * @method 
	 * */
	this.init = function(module) {
		switch(module) {
			case "VK":
				VKA.init();
				break;
			case "LastFm":
				LastFm.init();
				break;
			case "Player":
				Player.init();
				break;
		}
	}

	var Player = {
		inited: false,
		elem: null,
		duration: 0,
		loading: 0,
		progress: 0,
		loaded: false,

		next: function() {
			if (VKA.current.dur+1 < VKA.duration.length) {
				VKA.current.dur++;
			} else {
				VKA.current.dur = 0;
			}
			this.play();
		},

		play: function() {
			Player.duration = 0;
			Player.loading = 0;
			Player.progress = 0;
			Player.loaded = false;
			$('#player .progress .loaded, #player .progress .seek').css({width:'0%'});

			var source = VKA.sources[VKA.duration[VKA.current.dur]][VKA.current.src];
			var title = source.title;
			var duration = source.dur;
			var url = source.url;
			var time = mkTime(duration);

			$('#player .now-play .title').text(title);
			$('#player .now-play .time').text(time);
			//$('#player-source').attr('href',url).click();
			$('#player .controls .play-btn').removeClass('play').addClass('pause');

			this.elem.setAttribute('src', url);
			this.elem.load();
			this.elem.play();
		},

		resume: function() {
			this.elem.play();
		},

		pause: function() {
			this.elem.pause();
		},

		init: function() {
			this.inited = true;
			this.elem = new Audio("");
			this.elem.id = "audio";
			this.elem.src = "http://www.w3schools.com/html/horse.mp3";
			this.elem.loop = "";
			this.elem.volume = 1;
			this.elem.load();
			var w = $('#player').width() - 100;
			$('#player .controls .progress').css({width:w+'px'});
			$('#player .controls').slideDown();
			//this.elem.play();
			
			$('#player .play-btn').click(function(){
				if ($(this).hasClass('play')) {
					$(this).removeClass('play').addClass('pause');
					Player.resume();
				} else {
					$(this).removeClass('pause').addClass('play');
					Player.pause();
				}
			});
			$('#player .source').click(function(){
				//$(this).css('-webkit-transform','rotate(0deg)'); 
				//$(this).css('transform','rotate(0deg)');
				$(this).css('border-spacing',0);
				$(this).animate({borderSpacing: -360 },{
					step: function(now,fx) {
					  $(this).css('-webkit-transform','rotate('+now+'deg)'); 
					  $(this).css('transform','rotate('+now+'deg)');
					}, duration:'slow'
				},'linear');
				Player.next();
			});
			$('#player .progress .loaded').click(function(e){
				var total = $(e.currentTarget).parent().width();
				var current = e.offsetX;
				var seekTo = parseInt((Player.duration/total)*current);
				Player.elem.currentTime = seekTo;

				console.log(seekTo);
			});

			// bind audio events
			this.elem.onprogress = function(e){
				if (Player.loaded) return;
				if (Player.duration !== 0) {
					if (this.buffered.end(this.buffered.length-1) > Player.loading) {
						Player.loading = this.buffered.end(this.buffered.length-1);
						if ((Player.duration - Player.loading) < 1) {
							Player.loaded = true;
						}
						if ((Player.loading/Player.duration - Player.progress) > 0.01) {
							Player.progress = (Player.loading/Player.duration).toFixed(2);
							$('#player .progress .loaded').css({width:Player.progress*100+'%'});
						}
					}
				} 
				
			};
			this.elem.ontimeupdate = function(e) {
				$('#player .progress .seek').css({width: (this.currentTime / Player.duration)*100+'%'});
			};
			this.elem.onended = function(e){
				$('#player li.playing').next().click();
			};
			this.elem.ondurationchange = function(e){
				if (this.duration !== "NaN") {
					Player.duration = this.duration;	
				}
			}



		}

	}

	var VKA = {
		auth: false,
		token: null,
		sources: [],
		duration: [],
		api: "http://api.vkontakte.ru/api.php?",
		artist: null,
		title: null,
		durs: [],
		current: {src:0, dur:0},
		audio: null,

		init: function(){
			var s = this;
			VK.init({apiId:1902594, nameTransportPath: '/xd_receiver.html', status: true});
			VK.Observer.subscribe('auth.login', function(response) {
				console.log("VK response", response);
				s.auth = true;
			});    
			VK.Api.call('audio.search', {q: 'spor', sort: 0, count: 10, offset: 0, v: 3, test_mode: 1}, function(r){
				if (defined(r.error)) {
					console.log("VK error occured", r.error);
					s.auth = false;
				}
				$('.ui-input-search').fadeIn("slow");
			});

			setTimeout(function(){
				$('.ui-input-search').fadeIn("slow");
			}, 2000);

			$('.track').live('click', function(){
				if (Player.inited === false) {
					Player.init();
				}
				$('.track.playing').removeClass('playing');
				$(this).addClass('playing');
				VKA.getFiles($(this));
			});

		},

		getFiles: function(t) {
			$.mobile.loading('show');
			this.artist = t.attr('data-artist');
			this.title = t.attr('data-title'); 
			var q = this.artist+' '+this.title;
			VK.Api.call('audio.search', {q: q, sort: 2, count: 200, offset: 0}, VKA.onGetFiles);
		},
			
		onGetFiles: function(data) {
			if (defined(data.error)) {
				console.log("VK error: ", data.error);
				error(data.error);
				VKA.auth = false;
				VK.Auth.login(null, VK.access.AUDIO);    
				return;
			}

			if (!defined(data.response) || empty(data.response) || data.response[0] == 0) {
				VKA.skip();
				return;
			}
			var total = data.response[0];
			var sort = new Array();
			VKA.sources = [];
			for (key in data.response) {
				var d = data.response[key];
				if (typeof(d.duration) == 'undefined') continue;
				if (typeof(d.title) == 'undefined') continue
				if (d.duration < 100 || d.duration > 900) continue;
				if (sort[d.duration] == null) {
					sort[d.duration] = 1;
					VKA.sources[d.duration] = [];
				} else {
					sort[d.duration]++;
				} 
				VKA.sources[d.duration].push({
					url: d.url,
					title: d.title,
					dur: d.duration
				});
			}
			if (empty(VKA.sources)) {
				VKA.skip();
				return;
			}
			$.mobile.loading('hide');
			VKA.duration = arsort(sort, 'SORT_NUMERIC');
			VKA.current = {src:0, dur:0};
			Player.play();
		},

		skip: function(){
			$('#player li.playing').addClass('missing').next().click();
		},
		
		mkTitle: function(q) {
			var r = /\(.*\)/gi;
			var s = q.match(r);
			if (s !== null) {
				return s[0].replace(/\(|\)/g,'');
			} else {
				return q;
			}
		},

	};



	/* *
	 * Last.fm subclass
	 * @method 
	 * */
	var LastFm =  {
		api: '//ws.audioscrobbler.com/2.0/?api_key=7f0ae344d4754c175067118a5975ab15&format=json&',
		query: null,
		artist: null,
		mbid: null,
		title: null,
		found : [],
		image: null,
		showing: false,
		tracksFor: null,

		init: function() {
			$('input#search').keyup(function(event){
				if (event.keyCode == '13') {
					if (VKA.auth === false) {
						VK.Auth.login(null, VK.access.AUDIO);    
					}
					var q = $('input#search').val();
					if (!empty(q)) {
						LastFm.getArtists(q);
					}
				}
			});
		},

		getArtists: function(q){
			$('#home .start').slideUp();
			$.mobile.loading('show');
			$.getJSON(this.api+'method=artist.search&artist='+ q.enc() +'&callback=?', LastFm.onGetArtists);	
		},

		onGetArtists: function(e) {
			var i = 0;
			var result = '';
			$(e.results.artistmatches.artist).each(function(){
				if (++i > 12) return false;
				if (defined(this.image) && !empty(this.image[4]['#text'])) {
					var img = this.image[4]['#text'];
				} else {
					var img = img2 = 'http://i.imgur.com/1jdKzpw.png';
				}
				var name = this.name;
				var url = this.url;
				result += '<div class="artist" data-mbid="'+this.mbid+'" data-artist="'+name+
					'" data-img="'+img+'" style="background-image: url('+img+')">\
					<div class="info ellips">'+name+'</div></div>';
			});
			$('#artist-search').html(result);
			$.mobile.silentScroll(100);
			LastFm.initArtists();
		},

		initArtists: function() {
			var s = this;
			$('#artist-search .artist').click(function(){
				s.image = $(this).css('background-image');
				s.artist = $(this).attr('data-artist');
				s.mbid = $(this).attr('data-mbid');
				$('#albums ul.list').html("<li id='top-tracks'><a>Top Tracks for "+s.artist+"</a></li>");
				$('#albums #top-tracks').click(function(){
					LastFm.getTracks(LastFm.mbid, LastFm.artist);
				});
				if (defined(s.mbid) && !empty(s.mbid)) {		
					LastFm.getSimilar(s.mbid);    
					//this.getTracks(mbid);   after similar
				} else {
					LastFm.getSimilar(null, s.artist);
					//this.getTracks(null, artist); later
				}
				Discogs.findArtist(s.artist);
			});
			$.mobile.loading('hide');
			$('#artist-search').show();
		},
	 
		getSimilar: function(mbid, artist) {
			$.mobile.loading('show');
			if (defined(mbid)) {
				$.getJSON(this.api+'method=artist.getsimilar&mbid='+ mbid +'&callback=?', LastFm.onGetSimilar);
			} else {
				$.getJSON(this.api+'method=artist.getsimilar&artist='+ artist.enc() +'&autocorrect=1&callback=?', LastFm.onGetSimilar);
			}
		},
		 
		onGetSimilar: function(e) {
			var result = '';
			$('#similar #similar-for').text(LastFm.artist);
			$('#similar .list').empty();
			$(e.similarartists.artist).each(function(){
				if (defined(this.image)) {
					 var img = this.image[2]['#text'];
				} else {
					 var img = '';
				}
				result += '<div class="similar" data-mbid="'+ this.mbid 
					   +'" data-artist="'+ this.name +'" style="background-image: url('+ img +')">\
					   <div class="info ellips">'+ this.name +'</div></div>';
			});
			$('#similar .list').append(result);
			LastFm.initSimilar();   
		 },	 
		 
		initSimilar: function() {
			var s = this;
			$('#similar .similar').click(function(){
				s.artist = $(this).attr('data-artist');
				s.mbid = $(this).attr('data-mbid')
				$('#albums ul.list').html("<li id='top-tracks'><a>Top Tracks for "+s.artist+"</a></li>");
				$('#albums #top-tracks').click(function(){
					LastFm.getTracks(LastFm.mbid, LastFm.artist);
				});
				Discogs.findArtist(s.artist);
			});
			s.showing = true;
			$.mobile.changePage('#similar');				
			$.mobile.loading('show');
			setTimeout(function(){
				s.showing = false;
				if (Discogs.loaded === true) {
					$.mobile.changePage('#albums');	
				}
			}, 2000);
		},

		getTracks: function(mbid, artist) {  
			LastFm.tracksFor = artist;
			$.mobile.loading('show');
			if (defined(mbid)) {
				$.getJSON(this.api+'method=artist.gettoptracks&mbid='+ mbid +'&limit=50&callback=?', LastFm.onGetTracks);    
			} else {
				$.getJSON(this.api+'method=artist.gettoptracks&artist='+ artist.enc() +'&autocorrect=1&limit=50&callback=?', LastFm.onGetTracks);
			}
		},
			 
		onGetTracks: function(e) {
			var s = this;
			s.found = [];
			var result = ''; //'<div class="head">'+ e.toptracks['@attr'].artist +' Tracks</div>';
			$(e.toptracks.track).each(function(){
				var title = LastFm.prettify(this.name);
				if (!in_array(title, s.found)) {
					result += "<li class='track' data-artist='"+ this.artist.name +"' data-title='"+ title +"'>\
						<a data-artist='"+ this.artist.name +"' data-title='"+ title +"'>"
						+ cap(title) +"<span class='ui-li-count'>"+ this.playcount +"</span></a></li>";       
					s.found.push(title);
				}
			});
			if (empty(s.found)) {
				$.get('lf.php?q='+LastFm.artist.enc(), LastFm.onGetCharts);
			} else {
				$('#player ul.list').html(result).listview().listview('refresh');	
				$('#player #tracks-for').text(LastFm.artist +" Top");
				$.mobile.changePage('#player');
				$.mobile.loading('hide');
			}
			
		},

		onGetCharts: function(html) {
			LastFm.found = [];
			var result = '';
			var div = $(html).find('div.module-body.chart.current');
			div.find('table tr').each(function(k,v){
				var title = LastFm.prettify($(v).find('td.subjectCell a').text());
				if (!in_array(title, LastFm.found)) {
					result += "<li class='track' data-artist='"+ LastFm.tracksFor +"' data-title='"+ title +"'>\
						<a data-artist='"+ LastFm.tracksFor +"' data-title='"+ title +"'>"
						+ cap(title) +"</a></li>";  
					LastFm.found.push(title);
				} 
			});
			if (LastFm.found.length > 0) {
				$('#player ul.list').html(result).listview().listview('refresh');	
				$('#player #tracks-for').text(LastFm.tracksFor +" Top");
				$.mobile.changePage('#player');
				$.mobile.loading('hide');
			}
		},

		prettify: function(str) {
			 str = trimBrackets(str);
			 str = str.replace(/( remix| rmx| edit).*/gi,''); // remove (this), 1 word before and everything after
			 str = str.replace(/( feat| ft\.| vocals by| vip).*/gi,''); // remove (this) and everything after
			 str = str.replace(/(full version|remix|remi| mix|rmx| edit)/gi,''); //remove (this)
			 str = str.replace(/(mp3|wav|flac|ogg)/gi,'');
			 str = str.replace(/^(A1 |B1 |C1 |D1 |E1 |F1 |G1 |A2 |B2 |C2 |D2 |E2 |F2 )/gi,'');
			 return cleanName(str);
		}	
	};

	var Discogs = {
		api: "http://api.discogs.com/",
		found: [],
		artist: null,
		artistUrl: null,
		loaded: false,
		album: null,
			
		
		findArtist: function(q) {
			this.found = [];
			this.artist = q;
			this.artistUrl = null;
			q = encodeURIComponent(q);
			$('.dc-albums').empty().addClass('load4');
			//$.getJSON(this.api+'database/search?type=artist&q='+q+'&callback=?', Discogs.onFindArtist);    
			$.get('dc.php?q='+q, Discogs.onFindArtist);
		},

		onFindArtist: function(html) {
			var cards = $(html).find('div.card');
			if (empty(cards)) {
				$('.dc-albums').removeClass('load4');
				return;
			}
			var id = null;
			var next = null;
			var first = $(html).find('div.card').eq(0).data('object-id');
			cards.each(function(k,v){
				var img = $(v).find('.card_image img').attr('src');
				var txt = $(v).find('.card_body h4 a').text();
				if (txt.lc().indexOf(Discogs.artist.lc()) > -1) {
					if (img === "http://static.discogs.com/images/default-artist.png" 
					||  img === "http://s.pixogs.com/images/default-artist.png") {
						next = $(v).data('object-id');
					} else {
						id = $(v).data('object-id');
						return false;	
					}
				}
			});
			
			if (!defined(id)) {
				var id = defined(next) ? next : first;    
			}

			$.getJSON(Discogs.api+'artists/'+id+'/releases?per_page=100&callback=?', Discogs.onGetReleases);
			
		},




		onGetReleases: function(e) {
			var s = Discogs;
			s.found = [];
			var results = '';
			var data = e.data;
			data.releases.reverse();
			$(data.releases).each(function(){
				if (this.role === "Main") {
					if (s.found.indexOf(this.title) > -1) {
						return true;
					}
					s.found.push(this.title);
					var y = "";
					if (defined(this.year)) {
						y = "<span class='ui-li-count'>"+this.year+"</span>";
					}
					var str =  "<li class='album' data-title='"+ this.title +"' data-year='"+this.year+"'\
										data-url='"+ this.resource_url +"' data-id='"+ this.id+"' >\
										<a>"+ this.title + y +"</a></li>";                
					results += str;
				}            
			});
			
			$('#albums ul.list').append($(results).sort(Discogs.sortYear)).listview().listview('refresh');;
			$('#albums #albums-for').text(LastFm.artist);
			$('#albums .album').click(function(e){
				Discogs.album = $(this).data('title');
				var url = $(this).data('url');
				Discogs.getTracks(url);
				e.preventDefault();
			});
			Discogs.loaded = true;
			if (LastFm.showing === false) {
				$.mobile.changePage('#albums');
				$.mobile.loading('hide');
			}
			
		},

		getTracks: function(url){
			$.mobile.loading('show');
			$.getJSON(url+'?callback=?', Discogs.onGetTracks);    
		},

		onGetTracks: function(e) {
			var data = e.data;
			var results = '';
			$('#player #tracks-for').text(Discogs.album);
			$(data.tracklist).each(function(){
				if (!defined(this.title) || empty(this.title)) {
					return true;
				}
				var d = " ";
				if (defined(this.duration) && !empty(this.duration)) {
					var d = "<span class='ui-li-count'>"+ this.duration +"</span>";
				}
				results += '<li class="track" data-artist="'+ Discogs.artist +'" data-title="'+this.title+'" >\
						<a data-artist="'+ Discogs.artist +'" data-title="'+this.title+'">'
						+ cap(this.title) +d+ "</a></div>";
						
			});
			$('#player ul.list').html(results).listview().listview('refresh');
			$.mobile.loading('hide');
			$.mobile.changePage("#player");
		},
		
		sortYear: function(a,b) {  
			return $(a).data('year') > $(b).data('year') ? 1 : -1;  
		}  
	}
}
