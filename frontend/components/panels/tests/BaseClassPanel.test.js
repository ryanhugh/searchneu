/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import renderer from 'react-test-renderer';

import mockData from './mockData';
import BaseClassPanel from '../BaseClassPanel';
import macros from '../../macros';


it('should not render a show more button', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs0210 } />);

  const button = component.getInstance().getMoreSectionsButton();

  expect(button).toMatchSnapshot();
});


it('should render a button', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs1210 } />);

  const button = component.getInstance().getMoreSectionsButton();

  expect(button).toMatchSnapshot();
});


it('clicking the button will cause more sections to be rendered', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs1210 } />);

  expect(component.getInstance().state.renderedSections.length).toBe(3);
  expect(component.getInstance().state.unrenderedSections.length).toBe(2);

  component.getInstance().onShowMoreClick();

  expect(component.getInstance().state.renderedSections.length).toBe(5);
  expect(component.getInstance().state.unrenderedSections.length).toBe(0);
});


it('should display credits string', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs1210 } />);

  let instance = component.getInstance();

  expect(instance.getCreditsString()).toBe('1 credits');

  const cs0210 = renderer.create(<BaseClassPanel aClass={ mockData.cs0210 } />);

  instance = cs0210.getInstance();

  expect(instance.getCreditsString()).toBe('1 to 49 credits');
});


it('should render prereqs string', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs0210 } />);

  const instance = component.getInstance();

  const prereqs = instance.getReqsString(macros.prereqTypes.PREREQ);

  expect(prereqs).toMatchSnapshot();
});


it('should render coreqs string', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs0210 } />);

  const instance = component.getInstance();

  const coreqs = instance.getReqsString(macros.prereqTypes.COREQ);

  expect(coreqs).toMatchSnapshot();
});

it('should render single prereq string', () => {
  const component = renderer.create(<BaseClassPanel aClass={ mockData.cs9999 } />);

  const instance = component.getInstance();

  const prereqs = instance.optionalDisplay(macros.prereqTypes.PREREQ);

  expect(prereqs).toEqual(['Error while parsing prerequisites.']);
});
