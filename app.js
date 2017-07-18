// set up barba
document.addEventListener("DOMContentLoaded", function() {

    // assign some variables
    var lastElementClicked;
    var isAnimating = false;
    var $body = document.querySelector('body');
    var $html = document.querySelector('html');

    // options
    Barba.Pjax.Dom.wrapperId = 'content-wrapper';
    Barba.Pjax.Dom.containerClass = 'content-container';

    // ---------------- //
    // VIEWS
    // ---------------- //
    var homeView = Barba.BaseView.extend({
        namespace: 'home',
        onLeave: function() {
            $body.style.overflow = 'hidden';
        },
        onLeaveCompleted: function() {
            $body.style.overflow = 'initial';
        }
    });

    var detailView = Barba.BaseView.extend({
        namespace: 'detail',
        onEnterCompleted: function() {
            // The Transition has just finished
            // can now use functions/events specifically for this page

            // -- vars
            var scrollBtn = document.querySelector('.scrolldown');

            // -- events
            scrollBtn.addEventListener('click', scrollToContent);

            // -- functions
            function scrollToContent(e) {
                e.preventDefault();
                TweenLite.to(window, 0.5, {
                    scrollTo: {
                        ease: Power3.easeOut, 
                        y: '.maincontent'
                    }
                });
            };

            // call the start function below when we load this page
            this.start();
        },
        onLeave: function() {
            // A new Transition toward a new page has just started.
            $body.classList.remove('loaded');
            $html.style.overflow = 'hidden';
        },
        onLeaveCompleted: function() {
            $html.style.overflow = 'initial';     

            if(typeof(Storage) !== 'undefined') {
                // See if there is a scroll pos and go there.
                var lastYPos = +localStorage.getItem('scrollYPos');
                if (lastYPos) {
                    window.scrollTo(0, lastYPos);
                }
            }
        },
        start: function() {
            var tl = new TimelineMax({
                onComplete: function() {
                    $body.classList.add('loaded');
                    isAnimating = false;
                }
            });
        }
    });

    // Don't forget to init the view!
    homeView.init();
    detailView.init();
    Barba.Pjax.init();
    Barba.Prefetch.init();

    // listen to the event on click
    // can now reference lastElementClicked to scroll to where it's been clicked
    Barba.Dispatcher.on('linkClicked', function(el) {
        lastElementClicked = el;
    });
    
    // -------------------- //
    // TRANSITION FUNCTIONS
    // -------------------- //
    var revealProject = Barba.BaseTransition.extend({
        start: function() {
            isAnimating = true;

            // set up functions asynchronously
            Promise
                .all([this.newContainerLoading, this.scrollToProject()])
                .then(this.showNewPage.bind(this));
        },

        // first transition function
        scrollToProject: function() {
            var project = $(lastElementClicked).parents('.project');
            var deferred = Barba.Utils.deferred();
            console.log(project);
            TweenLite.to(window, 0.5, {
                scrollTo: {
                    y: project
                },
                onComplete: function() {
                    deferred.resolve();
                    if(typeof(Storage) !== 'undefined') {
                        // See if there is a scroll pos and go there.
                        var lastYPos = +localStorage.getItem('scrollYPos');
                        localStorage.setItem('scrollYPos', window.scrollY);
                    }
                }
            });

            return deferred.promise;
        },

        // transition to new page / object
        showNewPage: function() {

            // assign objects that are transitioning
            var _this = this;
            var newImage = _this.newContainer.querySelector('img');
            var scrollArrow = _this.newContainer.querySelector('.scrolldown');
            var newText = _this.newContainer.querySelector('summary');
            var newTextLink = _this.newContainer.querySelector('.link');

            // reset and create a new timeline
            var tl = new TimelineMax({
                onComplete: function() {
                    _this.newContainer.style.position = 'static';
                    _this.done();

                    // once timeline is finished, reset window to top
                    // to avoid jumping
                    window.scroll(0, 0);
                    isAnimating = false;
                }
            });

            // preset transitional objects
            TweenLite.set(_this.newContainer, {
                position: 'fixed',
                visibility: 'visible',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                opacity: 0,
                zIndex: 10
            });

            // start transitions
            tl.to(_this.newContainer, 0.3, {opacity: 1 });
            tl.to(newImage, 0.3, { opacity: 0 });
            tl.to(newTextLink, 0.3, { opacity: 0 }, '-=0.3');
            tl.to(newText, 0.7, { ease: Expo.easeOut, y: 30 });
            tl.to(scrollArrow, 0.5, {
                ease: Back.easeOut, 
                opacity: 1,
                y: 0
            }, '-=0.7');
        }
    });

    var closeProject = Barba.BaseTransition.extend({
        start: function() {
            isAnimating = true;

            Promise
                // Promise Async, do this, then this before load --- our animation 
                // functions in the .all will run first
                .all([this.newContainerLoading, this.scrollTop()])
                .then(this.hideNewPage.bind(this));
        },
        scrollTop: function() {
            var deferred = Barba.Utils.deferred();
            var obj = { y: window.pageYOffset };

            TweenLite.to(obj, 0.4, {
                y: 0,
                onUpdate: function() {
                if (obj.y === 0) {
                    deferred.resolve();
                }
                    window.scroll(0, obj.y);
                },
                onComplete: function() {
                    deferred.resolve();
                }
            });

            return deferred.promise;
        },

        // transition out new page / object
        hideNewPage: function() {

            // assign objects that are transitioning
            var _this = this;
            var oldText = _this.oldContainer.querySelector('summary');
            var oldscrollArrow = _this.oldContainer.querySelector('.scrolldown');
            var oldImage = _this.oldContainer.querySelector('img');
            var oldTextLink = _this.oldContainer.querySelector('.link');

            // reset and create a new timeline
            var tl = new TimelineMax({
                onComplete: function() {
                    _this.newContainer.style.position = 'static';
                    _this.done();
                    isAnimating = false;
                }
            });

            // start transitions
            tl.to(oldImage, 0.3, { opacity: 1 });
            tl.to(oldscrollArrow, 0.3, { opacity: 0 });
            tl.to(oldTextLink, 0.3, { opacity: 1 }, '-=0.3');
            tl.to(oldText, 0.7, { ease: Expo.easeOut, y: -113 });
            tl.to(_this.newContainer, 0.3, { opacity: 1 });
        }
    });

    // -------------------- //
    // SET TRANSITIONS
    // -------------------- //
    Barba.Pjax.getTransition = function() {
        var transitionPage = revealProject;

        // if a page has a namespace of 'detail' use the following transition
        if (Barba.HistoryManager.prevStatus().namespace === 'detail') {
            transitionPage = closeProject;
        }

        return transitionPage;
    };
});