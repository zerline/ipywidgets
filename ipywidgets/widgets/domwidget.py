# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

"""Contains the DOMWidget class"""

from traitlets import Int, Unicode
from .widget import Widget, widget_serialization
from .trait_types import InstanceDict, TypedTuple
from .widget_layout import Layout
from .widget_style import Style


class DOMWidget(Widget):
    """Widget that can be inserted into the DOM"""

    _model_name = Unicode('DOMWidgetModel').tag(sync=True)
    _dom_classes = TypedTuple(trait=Unicode(), help="CSS classes applied to widget DOM element").tag(sync=True)
    _focus = Unicode(None, allow_none=True, help="Focus value: on/off/none.").tag(sync=True)
    _tabindex = Int(help="Tabulation index.").tag(sync=True)
    _tooltip = Unicode(None, allow_none=True, help="Any tooltip.").tag(sync=True)
    layout = InstanceDict(Layout).tag(sync=True, **widget_serialization)

    def add_class(self, className):
        """
        Adds a class to the top level element of the widget.

        Doesn't add the class if it already exists.
        """
        if className not in self._dom_classes:
            self._dom_classes = list(self._dom_classes) + [className]
        return self

    def remove_class(self, className):
        """
        Removes a class from the top level element of the widget.

        Doesn't remove the class if it doesn't exist.
        """
        if className in self._dom_classes:
            self._dom_classes = [c for c in self._dom_classes if c != className]
        return self

    def _repr_keys(self):
        for key in super(DOMWidget, self)._repr_keys():
            # Exclude layout if it had the default value
            if key == 'layout':
                value = getattr(self, key)
                if repr(value) == '%s()' % value.__class__.__name__:
                    continue
            yield key
        # We also need to include _dom_classes in repr for reproducibility
        if self._dom_classes:
            yield '_dom_classes'

    def set_tooltip(self, s):
        """Set _tooltip text, which is
        actually the `title` HTML attribute.

        Parameters
        ----------
        s: string
            Tooltip text
        """
        self._tooltip = s

    def set_tabindex(self, i=0):
        """Set tabindex for this DOM element.
        NB: this method is here for completeness
        but should be avoided for i>0.
        (see https://developer.paciellogroup.com/blog/2014/08/using-the-tabindex-attribute/)

        Parameters
        ----------
        i: integer
            Order in the keyboard tabulation.
        """
        self.tabindex = i

    def set_tabbable(self):
        """Make this DOM element reachable
        to keyboard tabulation navigation.
        """
        self.set_tabindex(0)

    def set_untabbable(self):
        """Make this DOM element unreachable
        to keyboard tabulation navigation.
        """
        self.set_tabindex(-1)

    def focus(self):
        """Give focus to this DOM element.
        """
        self._focus = ''
        self._focus = 'on'

    def blur(self):
        """Remove focus from this DOM element.
        """
        self._focus = ''
        self._focus = 'off'
