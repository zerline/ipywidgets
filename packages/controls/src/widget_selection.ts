// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
    CoreDescriptionModel,
} from './widget_core';

import {
    DescriptionView, DescriptionStyleModel
} from './widget_description';

import {
    uuid
} from './utils';

import * as _ from 'underscore';
import * as utils from './utils';
import $ from 'jquery';

export
class SelectionModel extends CoreDescriptionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'SelectionModel',
            index: '',
            _options_labels: [],
            disabled: false,
        };
    }
}

export
class DropdownModel extends SelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'DropdownModel',
            _view_name: 'DropdownView',
            button_style: ''
        };
    }
}

// TODO: Make a phosphor dropdown control, wrapped in DropdownView. Also, fix
// bugs in keyboard handling. See
// https://github.com/jupyter-widgets/ipywidgets/issues/1055 and
// https://github.com/jupyter-widgets/ipywidgets/issues/1049
// For now, we subclass SelectView to provide DropdownView
// For the old code, see commit f68bfbc566f3a78a8f3350b438db8ed523ce3642

export
class DropdownView extends DescriptionView {
    /**
     * Public constructor.
     */
    initialize(parameters: any) {
        super.initialize(parameters);
        this.listenTo(this.model, 'change:_options_labels', () => this._updateOptions());
    }

    /**
     * Called when view is rendered.
     */
    render() {
        super.render();

        this.el.classList.add('jupyter-widgets');
        this.el.classList.add('widget-inline-hbox');
        this.el.classList.add('widget-dropdown');

        this.listbox = document.createElement('select');
        this.listbox.id = this.label.htmlFor = uuid();
        this.el.appendChild(this.listbox);
        this._updateOptions();
        this.update();
    }

    /**
     * Update the contents of this view
     */
    update() {
        // Disable listbox if needed
        this.listbox.disabled = this.model.get('disabled');

        // Select the correct element
        let index = this.model.get('index');
        this.listbox.selectedIndex = index === null ? -1 : index;
        return super.update();
    }

    updateTooltip() {
        let title = this.model.get('description_tooltip');
        if (!title) {
            this.listbox.removeAttribute('title');
        } else if (this.model.get('description').length === 0) {
            this.listbox.setAttribute('title', title);
        }
	this.label.setAttribute('title', "touche'!");
    }

    _updateOptions() {
        this.listbox.textContent = '';
        let items = this.model.get('_options_labels');
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let option = document.createElement('option');
            option.textContent = item.replace(/ /g, '\xa0'); // space -> &nbsp;
            option.setAttribute('data-value', encodeURIComponent(item));
            option.value = item;
            this.listbox.appendChild(option);
        }
    }

    events(): {[e: string]: string} {
        return {
            'change select': '_handle_change'
        };
    }

    /**
     * Handle when a new value is selected.
     */
    _handle_change() {
        this.model.set('index', this.listbox.selectedIndex === -1 ? null : this.listbox.selectedIndex);
        this.touch();
    }

    listbox: HTMLSelectElement;
}



export
class SelectModel extends SelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'SelectModel',
            _view_name: 'SelectView',
            rows: 5
        };
    }
}

export
class SelectView extends DescriptionView {
    /**
     * Public constructor.
     */
    initialize(parameters: any) {
        super.initialize(parameters);
        this.listenTo(this.model, 'change:_options_labels', () => this._updateOptions());
        this.listenTo(this.model, 'change:index', (model, value, options) => this.updateSelection(options));
        // Create listbox here so that subclasses can modify it before it is populated in render()
        this.listbox = document.createElement('select');
    }

    /**
     * Called when view is rendered.
     */
    render() {
        super.render();

        this.el.classList.add('jupyter-widgets');
        this.el.classList.add('widget-inline-hbox');
        this.el.classList.add('widget-select');

        this.listbox.id = this.label.htmlFor = uuid();
        this.el.appendChild(this.listbox);
        this._updateOptions();
        this.update();
        this.updateSelection();
    }

    /**
     * Update the contents of this view
     */
    update() {
        super.update();
        this.listbox.disabled = this.model.get('disabled');
        let rows = this.model.get('rows');
        if (rows === null) {
            rows = '';
        }
        this.listbox.setAttribute('size', rows);
    }

    updateSelection(options: any = {}) {
        if (options.updated_view === this) {
            return;
        }
        let index = this.model.get('index');
        this.listbox.selectedIndex = index === null ? -1 : index;
    }

    _updateOptions() {
        this.listbox.textContent = '';
        let items = this.model.get('_options_labels');
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let option = document.createElement('option');
            option.textContent = item.replace(/ /g, '\xa0'); // space -> &nbsp;
            option.setAttribute('data-value', encodeURIComponent(item));
            option.value = item;
            this.listbox.appendChild(option);
        }
    }

    events(): {[e: string]: string} {
        return {
            'change select': '_handle_change'
        };
    }

    /**
     * Handle when a new value is selected.
     */
    _handle_change() {
        this.model.set('index', this.listbox.selectedIndex, {updated_view: this});
        this.touch();
    }

    listbox: HTMLSelectElement;
}

export
class RadioButtonsModel extends SelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'RadioButtonsModel',
            _view_name: 'RadioButtonsView',
            tooltips: [],
            icons: [],
            button_style: ''
        };
    }
}


export
class RadioButtonsView extends DescriptionView {
    /**
     * Called when view is rendered.
     */
    render() {
        super.render();

        this.el.classList.add('jupyter-widgets');
        this.el.classList.add('widget-inline-hbox');
        this.el.classList.add('widget-radio');

        this.container = document.createElement('div');
        this.el.appendChild(this.container);
        this.container.classList.add('widget-radio-box');

        this.update();
    }

    /**
     * Update the contents of this view
     *
     * Called when the model is changed.  The model may have been
     * changed by another view or by a state update from the back-end.
     */
    update(options?: any) {
        let view = this;
        let items: string[] = this.model.get('_options_labels');
        let radios = _.pluck(
            this.container.querySelectorAll('input[type="radio"]'),
            'value'
        );
        let stale = items.length != radios.length;

        if (!stale) {
            for (let i = 0, len = items.length; i < len; ++i) {
                if (radios[i] !== items[i]) {
                    stale = true;
                    break;
                }
            }
        }

        if (stale && (options === undefined || options.updated_view !== this)) {
            // Add items to the DOM.
            this.container.textContent = '';
            items.forEach(function(item: any, index: number) {
                let label = document.createElement('label');
                label.textContent = item;
                view.container.appendChild(label);

                let radio = document.createElement('input');
                radio.setAttribute('type', 'radio');
                radio.value = index.toString();
                radio.setAttribute('data-value', encodeURIComponent(item));
                label.appendChild(radio);
           });
        }
        items.forEach(function(item: any, index: number) {
            let item_query = 'input[data-value="' +
                encodeURIComponent(item) + '"]';
                let radio = view.container.querySelectorAll(item_query);
            if (radio.length > 0) {
              let radio_el = radio[0] as HTMLInputElement;
              radio_el.checked = view.model.get('index') === index;
              radio_el.disabled = view.model.get('disabled');
            }
        });

        // Schedule adjustPadding asynchronously to
        // allow dom elements to be created properly
        setTimeout(this.adjustPadding, 0, this);

        return super.update(options);
    }

    /**
     * Adjust Padding to Multiple of Line Height
     *
     * Adjust margins so that the overall height
     * is a multiple of a single line height.
     *
     * This widget needs it because radio options
     * are spaced tighter than individual widgets
     * yet we would like the full widget line up properly
     * when displayed side-by-side with other widgets.
     */
    adjustPadding(e: this) {
        // Vertical margins on a widget
        let elStyles = window.getComputedStyle(e.el);
        let margins = parseInt(elStyles.marginTop, 10) + parseInt(elStyles.marginBottom, 10);

        // Total spaces taken by a single-line widget
        let lineHeight = e.label.offsetHeight + margins;

        // Current adjustment value on this widget
        let cStyles = window.getComputedStyle(e.container);
        let containerMargin = parseInt(cStyles.marginBottom);

        // How far we are off from a multiple of single windget lines
        let diff = (e.el.offsetHeight + margins - containerMargin) % lineHeight;

        // Apply the new adjustment
        let extraMargin = diff == 0 ? 0 : (lineHeight - diff);
        e.container.style.marginBottom = extraMargin + 'px';
    }

    events(): {[e: string]: string} {
        return {
            'click input[type="radio"]': '_handle_click'
        };
    }

    /**
     * Handle when a value is clicked.
     *
     * Calling model.set will trigger all of the other views of the
     * model to update.
     */
    _handle_click (event: Event) {
        let target = event.target as HTMLInputElement;
        this.model.set('index', parseInt(target.value), {updated_view: this});
        this.touch();
    }

    container: HTMLDivElement;
}

export
class ToggleButtonsStyleModel extends DescriptionStyleModel {
    defaults() {
        return _.extend(super.defaults(), {
            _model_name: 'ToggleButtonsStyleModel',
        });
    }

    public static styleProperties = {
        ...DescriptionStyleModel.styleProperties,
        button_width: {
            selector: '.widget-toggle-button',
            attribute: 'width',
            default: null as any
        },
        font_weight: {
            selector: '.widget-toggle-button',
            attribute: 'font-weight',
            default: ''
        }
    };
}

export
 class ToggleButtonsModel extends SelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'ToggleButtonsModel',
            _view_name: 'ToggleButtonsView'
        };
    }
}


export
class ToggleButtonsView extends DescriptionView {
    initialize(options: any) {
        this._css_state = {};
        super.initialize(options);
        this.listenTo(this.model, 'change:button_style', this.update_button_style);
    }

    /**
     * Called when view is rendered.
     */
    render() {
        super.render();

        this.el.classList.add('jupyter-widgets');
        this.el.classList.add('widget-inline-hbox');
        this.el.classList.add('widget-toggle-buttons');

        this.buttongroup = document.createElement('div');
        this.el.appendChild(this.buttongroup);

        this.update();
        this.set_button_style();
    }

    /**
     * Update the contents of this view
     *
     * Called when the model is changed.  The model may have been
     * changed by another view or by a state update from the back-end.
     */
    update(options?: any) {
        let view = this;
        let items: string[] = this.model.get('_options_labels');
        let icons = this.model.get('icons') || [];
        let previous_icons = this.model.previous('icons') || [];
        let previous_bstyle = (ToggleButtonsView.classMap as any)[this.model.previous('button_style')] || '';
        let tooltips = view.model.get('tooltips') || [];
        let disabled = this.model.get('disabled');
        let buttons = this.buttongroup.querySelectorAll('button');
        let values = _.pluck(buttons, 'value');
        let stale = false;

        for (let i = 0, len = items.length; i < len; ++i) {
            if (values[i] !== items[i] || icons[i] !== previous_icons[i]) {
                stale = true;
                break;
            }
        }

        if (stale && (options === undefined || options.updated_view !== this)) {
            // Add items to the DOM.
            this.buttongroup.textContent = '';
            items.forEach((item: any, index: number) => {
                let item_html;
                let empty = item.trim().length === 0 &&
                    (!icons[index] || icons[index].trim().length === 0);
                if (empty) {
                    item_html = '&nbsp;';
                } else {
                    item_html = utils.escape_html(item);
                }

                let icon = document.createElement('i');
                let button = document.createElement('button');
                if (icons[index]) {
                    icon.className = 'fa fa-' + icons[index];
                }
                button.setAttribute('type', 'button');
                button.className = 'widget-toggle-button jupyter-button';
                if (previous_bstyle) {
                    button.classList.add(previous_bstyle);
                }
                button.innerHTML = item_html;
                button.setAttribute('data-value', encodeURIComponent(item));
                button.setAttribute('value', index.toString());
                button.appendChild(icon);
                button.disabled = disabled;
                if (tooltips[index]) {
                    button.setAttribute('title', tooltips[index]);
                }
                view.update_style_traits(button);
                view.buttongroup.appendChild(button);
            });
        }

        // Select active button.
        items.forEach(function(item: any, index: number) {
            let item_query = '[data-value="' + encodeURIComponent(item) + '"]';
            let button = view.buttongroup.querySelector(item_query);
            if (view.model.get('index') === index) {
                button.classList.add('mod-active');
            } else {
                button.classList.remove('mod-active');
            }
        });

        this.stylePromise.then(function(style) {
            if (style) {
                style.style();
            }
        });
        return super.update(options);
    }

    update_style_traits(button?: HTMLButtonElement) {
        for (let name in this._css_state as string[]) {
            if (this._css_state.hasOwnProperty(name)) {
                if (name === 'margin') {
                    this.buttongroup.style[name] = this._css_state[name];
                } else if (name !== 'width') {
                    if (button) {
                        button.style[name] = this._css_state[name];
                    } else {
                        let buttons = this.buttongroup
                            .querySelectorAll('button');
                        if (buttons.length) {
                            (buttons[0]).style[name] = this._css_state[name];
                        }
                    }
                }
            }
        }
    }

    update_button_style() {
        let buttons = this.buttongroup.querySelectorAll('button');
        for (let i = 0; i < buttons.length; i++) {
            this.update_mapped_classes(ToggleButtonsView.classMap, 'button_style', buttons[i]);
        }
    }

    set_button_style() {
        let buttons = this.buttongroup.querySelectorAll('button');
        for (let i = 0; i < buttons.length; i++) {
            this.set_mapped_classes(ToggleButtonsView.classMap, 'button_style', buttons[i]);
        }
    }

    events(): {[e: string]: string} {
        return {
            'click button': '_handle_click'
        };
    }

    /**
     * Handle when a value is clicked.
     *
     * Calling model.set will trigger all of the other views of the
     * model to update.
     */
    _handle_click (event: Event) {
        let target = event.target as HTMLButtonElement;
        this.model.set('index', parseInt(target.value, 10), {updated_view: this});
        this.touch();
        // We also send a clicked event, since the value is only set if it changed.
        // See https://github.com/jupyter-widgets/ipywidgets/issues/763
        this.send({event: 'click'});
    }

    private _css_state: any;
    buttongroup: HTMLDivElement;
}

export
namespace ToggleButtonsView {
    export
    const classMap = {
        primary: ['mod-primary'],
        success: ['mod-success'],
        info: ['mod-info'],
        warning: ['mod-warning'],
        danger: ['mod-danger']
    };
}


export
class SelectionSliderModel extends SelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'SelectionSliderModel',
            _view_name: 'SelectionSliderView',
            orientation: 'horizontal',
            readout: true,
            continuous_update: true
        };
    }
}


export
class SelectionSliderView extends DescriptionView {
    /**
     * Called when view is rendered.
     */
    render () {
        super.render();

        this.el.classList.add('jupyter-widgets');
        this.el.classList.add('widget-inline-hbox');
        this.el.classList.add('widget-hslider');
        this.el.classList.add('widget-slider');

        (this.$slider = $('<div />') as any)
            .slider({
                slide: this.handleSliderChange.bind(this),
                stop: this.handleSliderChanged.bind(this)
            })
            .addClass('slider');

        // Put the slider in a container
        this.slider_container = document.createElement('div');
        this.slider_container.classList.add('slider-container');
        this.slider_container.appendChild(this.$slider[0]);
        this.el.appendChild(this.slider_container);

        this.readout = document.createElement('div');
        this.el.appendChild(this.readout);
        this.readout.classList.add('widget-readout');
        this.readout.style.display = 'none';

        this.listenTo(this.model, 'change:slider_color', (sender, value) => {
            this.$slider.find('a').css('background', value);
        });

        this.$slider.find('a').css('background', this.model.get('slider_color'));

        // Set defaults.
        this.update();
    }

    /**
     * Update the contents of this view
     *
     * Called when the model is changed.  The model may have been
     * changed by another view or by a state update from the back-end.
     */
    update(options?: any) {
        if (options === undefined || options.updated_view !== this) {
            let labels = this.model.get('_options_labels');
            let max = labels.length - 1;
            let min = 0;
            this.$slider.slider('option', 'step', 1);
            this.$slider.slider('option', 'max', max);
            this.$slider.slider('option', 'min', min);

            // WORKAROUND FOR JQUERY SLIDER BUG.
            // The horizontal position of the slider handle
            // depends on the value of the slider at the time
            // of orientation change.  Before applying the new
            // workaround, we set the value to the minimum to
            // make sure that the horizontal placement of the
            // handle in the vertical slider is always
            // consistent.
            let orientation = this.model.get('orientation');
            this.$slider.slider('option', 'value', min);
            this.$slider.slider('option', 'orientation', orientation);

            let disabled = this.model.get('disabled');
            this.$slider.slider('option', 'disabled', disabled);
            if (disabled) {
                this.readout.contentEditable = 'false';
            } else {
                this.readout.contentEditable = 'true';
            }

            // Use the right CSS classes for vertical & horizontal sliders
            if (orientation === 'vertical') {
                this.el.classList.remove('widget-hslider');
                this.el.classList.remove('widget-inline-hbox');
                this.el.classList.add('widget-vslider');
                this.el.classList.add('widget-inline-vbox');
            } else {
                this.el.classList.remove('widget-vslider');
                this.el.classList.remove('widget-inline-vbox');
                this.el.classList.add('widget-hslider');
                this.el.classList.add('widget-inline-hbox');
            }

            let readout = this.model.get('readout');
            if (readout) {
                // this.$readout.show();
                this.readout.style.display = '';
            } else {
                // this.$readout.hide();
                this.readout.style.display = 'none';
            }
            this.updateSelection();

        }
        return super.update(options);
    }

    events(): {[e: string]: string} {
        return {
            'slide': 'handleSliderChange',
            'slidestop': 'handleSliderChanged'
        };
    }

    updateSelection() {
        let index = this.model.get('index');
        this.$slider.slider('option', 'value', index);
        this.updateReadout(index);
    }

    updateReadout(index: any) {
        let value = this.model.get('_options_labels')[index];
        this.readout.textContent = value;
    }

    /**
     * Called when the slider value is changing.
     */
    handleSliderChange(e: Event, ui: { value?: number; values?: number[] }) {
        this.updateReadout(ui.value);

        // Only persist the value while sliding if the continuous_update
        // trait is set to true.
        if (this.model.get('continuous_update')) {
            this.handleSliderChanged(e, ui);
        }
    }

    /**
     * Called when the slider value has changed.
     *
     * Calling model.set will trigger all of the other views of the
     * model to update.
     */
    handleSliderChanged(e: Event, ui: { value?: number; values?: number[] }) {
        this.updateReadout(ui.value);
        this.model.set('index', ui.value, {updated_view: this});
        this.touch();
    }

    $slider: any;
    slider_container: HTMLDivElement;
    readout: HTMLDivElement;
}

export
class MultipleSelectionModel extends SelectionModel {
    defaults() {
        return { ...super.defaults(),
            _model_name: 'MultipleSelectionModel',
        };
    }
}


export
class SelectMultipleModel extends MultipleSelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'SelectMultipleModel',
            _view_name: 'SelectMultipleView',
            rows: null
        };
    }
}

export
class SelectMultipleView extends SelectView {
    /**
     * Public constructor.
     */
    initialize(parameters: any) {
        super.initialize(parameters);
        this.listbox.multiple = true;
    }

    /**
     * Called when view is rendered.
     */
    render() {
        super.render();
        this.el.classList.add('widget-select-multiple');
    }

    updateSelection(options: any = {}) {
        if (options.updated_view === this) {
            return;
        }
        let selected = this.model.get('index') || [];
        let listboxOptions = this.listbox.options;
        // Clear the selection
        this.listbox.selectedIndex = -1;
        // Select the appropriate options
        selected.forEach((i: number) => {
            listboxOptions[i].selected = true;
        });
    }

    /**
     * Handle when a new value is selected.
     */
    _handle_change() {
        let index = Array.prototype.map
            .call(this.listbox.selectedOptions || [], function(option: HTMLOptionElement) {
                return option.index;
            });
        this.model.set('index', index, {updated_view: this});
        this.touch();
    }
}

export
class SelectionRangeSliderModel extends MultipleSelectionModel {
    defaults() {
        return {...super.defaults(),
            _model_name: 'SelectionSliderModel',
            _view_name: 'SelectionSliderView',
            orientation: 'horizontal',
            readout: true,
            continuous_update: true
        };
    }
}


export
class SelectionRangeSliderView extends SelectionSliderView {
    /**
     * Called when view is rendered.
     */
    render () {
        super.render();
        this.$slider.slider('option', 'range', true);
    }

    updateSelection() {
        let index = this.model.get('index');
        this.$slider.slider('option', 'values', index.slice());
        this.updateReadout(index);
    }

    updateReadout(index: number[]) {
        let labels = this.model.get('_options_labels');
        let minValue = labels[index[0]];
        let maxValue = labels[index[1]];
        this.readout.textContent = `${minValue}-${maxValue}`;
    }

    /**
     * Called when the slider value is changing.
     */
    handleSliderChange(e: Event, ui: { values: number[]; }) {
        this.updateReadout(ui.values);

        // Only persist the value while sliding if the continuous_update
        // trait is set to true.
        if (this.model.get('continuous_update')) {
            this.handleSliderChanged(e, ui);
        }
    }

    /**
     * Called when the slider value has changed.
     *
     * Calling model.set will trigger all of the other views of the
     * model to update.
     */
    handleSliderChanged(e: Event, ui: { values: number[]; }) {
        // The jqueryui documentation indicates ui.values doesn't exist on the slidestop event,
        // but it appears that it actually does: https://github.com/jquery/jquery-ui/blob/ae31f2b3b478975f70526bdf3299464b9afa8bb1/ui/widgets/slider.js#L313
        this.updateReadout(ui.values);
        this.model.set('index', ui.values.slice(), {updated_view: this});
        this.touch();
    }

    $slider: any;
    slider_container: HTMLDivElement;
    readout: HTMLDivElement;
}
