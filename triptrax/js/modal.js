// Modal
// -------------
function Modal () {
    this.init = function ( btn ) {
        Modal.overlay = $('div.overlay');
        this.transEndEventNames = {
                'WebkitTransition': 'webkitTransitionEnd',
                'MozTransition': 'transitionend',
                'OTransition': 'oTransitionEnd',
                'msTransition': 'MSTransitionEnd',
                'transition': 'transitionend'
            };
        Modal.transEndEventName = this.transEndEventNames[ Modernizr.prefixed( 'transition' ) ];
        Modal.support = { transitions : Modernizr.csstransitions };
        btn.off('click', this.toggleModal);
        btn.on('click', this.toggleModal);
    };

    this.toggleModal = function ( elm ) {
        console.log(elm);
        var _transitions = Modal.support.transitions,
            _overlay = Modal.overlay,
            _supporTrans = Modal.support.transitions,
            _transEndEventName = Modal.transEndEventName;
        if( _overlay.hasClass('open') ) {
            _overlay.removeClass('open');
            _overlay.addClass('close');
            var onEndTransitionFn = function( ev ) {
                if( _transitions ) {
                    if( ev.propertyName !== 'visibility' ) return;
                    this.removeEventListener( _transEndEventName, onEndTransitionFn );
                }
                _overlay.removeClass('close');
            };

            if( _supporTrans ) {
                _overlay.on( _transEndEventName, onEndTransitionFn );
            } else {
                onEndTransitionFn();
            }
        } else if( !_overlay.hasClass('open') ) {
            var _content = _overlay.find("div.content");
            _content.html("");
            _overlay.removeClass('close');
            if ( elm && elm.length > 0 ) {
                elm.removeClass('hidden');
                _content.append(elm);
            }
            _overlay.addClass('open');
        }
    };
}
