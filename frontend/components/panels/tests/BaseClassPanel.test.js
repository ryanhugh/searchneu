/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import renderer from 'react-test-renderer';

import mockData from './mockData';
import BaseClassPanel from '../BaseClassPanel';


it('should not render a show more button', () => {
  const component = renderer.create(<BaseClassPanel aClass={mockData.cs0210} />);

  const button = component.getInstance().getShowMoreButton();

  expect(button).toMatchSnapshot();
});


it('should render a button', () => {
  const component = renderer.create(<BaseClassPanel aClass={mockData.cs1210} />);

  let tree = component.toJSON();

  const button = component.getInstance().getShowMoreButton();

  expect(button).toMatchSnapshot();
});

it('clicking the button will cause more sections to be rendered', () => {
  const component = renderer.create(<BaseClassPanel aClass={mockData.cs1210} />);

  expect(component.getInstance().state.renderedSections.length).toBe(3)
  expect(component.getInstance().state.unrenderedSections.length).toBe(2)

  component.getInstance().onShowMoreClick()

  expect(component.getInstance().state.renderedSections.length).toBe(5)
  expect(component.getInstance().state.unrenderedSections.length).toBe(0)
});


it('should display credits string', function() {
  const component = renderer.create(<BaseClassPanel aClass={mockData.cs1210} />);

  let instance = component.getInstance()

  expect(instance.getCreditsString()).toBe('1 credits')

  const cs0210 = renderer.create(<BaseClassPanel aClass={mockData.cs0210} />);

  instance = cs0210.getInstance()

  expect(instance.getCreditsString()).toBe('1 to 49 credits')

});


it('should render prereqs string', function() {
  const component = renderer.create(<BaseClassPanel aClass={mockData.cs0210} />);

  let instance = component.getInstance()

  let prereqs = instance.getReqsString('prereqs')

  expect(prereqs).toMatchSnapshot()
});


it('should render coreqs string', function() {
  const component = renderer.create(<BaseClassPanel aClass={mockData.cs0210} />);

  let instance = component.getInstance()

  let coreqs = instance.getReqsString('coreqs')

  expect(coreqs).toMatchSnapshot()
});