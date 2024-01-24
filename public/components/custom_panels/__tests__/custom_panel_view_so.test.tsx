/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { CustomPanelViewSO } from '../custom_panel_view_so';

import { act, cleanup, fireEvent, render, waitFor, screen } from '@testing-library/react';
import {
  panelBreadCrumbs,
  sampleEmptyPanel,
  samplePanel,
  samplePPLResponse,
  sampleSavedVisualization,
  sampleSavedObjectPanel,
  sampleSavedObjectPanelWithVisualization,
} from '../../../../test/panels_constants';
import httpClientMock from '../../../../test/__mocks__/httpClientMock';
import PPLService from '../../../../public/services/requests/ppl';
import { HttpResponse } from '../../../../../../src/core/public';
import DSLService from '../../../../public/services/requests/dsl';
import { coreStartMock } from '../../../../test/__mocks__/coreMocks';
import { applyMiddleware, createStore } from 'redux';
import { coreRefs } from '../../../framework/core_refs';
import { rootReducer } from '../../../framework/redux/reducers';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { setPanelList } from '../redux/panel_slice';

describe('Panels View SO Component', () => {
  configure({ adapter: new Adapter() });
  const store = createStore(rootReducer, applyMiddleware(thunk));

  const http = httpClientMock;
  let counter = 0;
  http.get = jest.fn(() => {
    if (counter === 0) {
      counter += 1;
      return Promise.resolve((samplePanel as unknown) as HttpResponse);
    } else return Promise.resolve((sampleSavedVisualization as unknown) as HttpResponse);
  });
  http.post = jest.fn(() => Promise.resolve((samplePPLResponse as unknown) as HttpResponse));
  const pplService = new PPLService(http);
  const dslService = new DSLService(http);
  coreRefs.savedObjectsClient.get = jest.fn().mockReturnValue(sampleSavedObjectPanel);
  coreRefs.savedObjectsClient.find = jest.fn().mockReturnValue(sampleSavedObjectPanel);
  coreRefs.savedObjectsClient.update = jest.fn();
  coreRefs.http.post = jest.fn();

  const props = {
    panelId: 'L8Sx53wBDp0rvEg3yoLb',
    coreSavedObjects: coreStartMock.savedObjects,
    chrome: coreStartMock.chrome,
    parentBreadcrumbs: panelBreadCrumbs,
    cloneCustomPanel: jest.fn(),
    onEditClick: (savedVisId: string) => {
      window.location.assign(`#/event_analytics/explorer/${savedVisId}`);
    },
    http,
    pplService,
    dslService,
  };

  const renderPanelView = (savedObject: any, overrides = {}) => {
    coreRefs.savedObjectsClient.get = jest.fn().mockReturnValue(savedObject);
    coreRefs.savedObjectsClient.find = jest.fn().mockReturnValue(savedObject);
    const utils = render(
      <Provider store={store}>
        <CustomPanelViewSO {...props} {...overrides} page="operationalPanels" />
      </Provider>
    );
    return utils;
  };

  afterEach(() => {
    cleanup();
  });

  it('renders panel view SO container without visualizations', async () => {
    const utils = renderPanelView(sampleSavedObjectPanel);
    // console.log(utils.debug());

    await waitFor(() => {
      expect(utils.container.firstChild).toMatchSnapshot();
    });
  });

  it('renders panels view SO container with visualizations', async () => {
    const utils = renderPanelView(sampleSavedObjectPanelWithVisualization);

    // console.log(utils.debug());
    await waitFor(() => {
      expect(utils.container.firstChild).toMatchSnapshot();
    });
  });

  it('render panel view container and refresh panel', async () => {
    const utils = renderPanelView(sampleSavedObjectPanelWithVisualization);
    expect(utils.container.firstChild).toMatchSnapshot();

    fireEvent.click(utils.getByTestId('superDatePickerApplyTimeButton'));
  });

  // it('render panel view container and test panelActionContextMenu', async () => {
  //   const utils = renderPanelView(sampleSavedObjectPanelWithVisualization);
  //   expect(utils.container.firstChild).toMatchSnapshot();

  //   fireEvent.click(utils.getByTestId('panelActionContextMenu'));
  //   fireEvent.click(utils.getByTestId('reloadPanelContextMenuItem'));
  //   expect(utils.container.firstChild).toMatchSnapshot();

  //   fireEvent.click(utils.getByTestId('panelActionContextMenu'));
  //   fireEvent.click(utils.getByTestId('renamePanelContextMenuItem'));
  //   expect(utils.container.firstChild).toMatchSnapshot();

  //   fireEvent.click(utils.getByTestId('panelActionContextMenu'));
  //   fireEvent.click(utils.getByTestId('duplicatePanelContextMenuItem'));
  //   expect(utils.container.firstChild).toMatchSnapshot();

  //   fireEvent.click(utils.getByTestId('panelActionContextMenu'));
  //   fireEvent.click(utils.getByTestId('deletePanelContextMenuItem'));
  //   expect(utils.container.firstChild).toMatchSnapshot();
  // });

  it('render panel view so container and rename dashboard', async () => {
    store.dispatch(setPanelList([sampleSavedObjectPanelWithVisualization]));
    const utils = renderPanelView(sampleSavedObjectPanelWithVisualization);

    fireEvent.click(utils.getByTestId('panelActionContextMenu'));
    fireEvent.click(utils.getByTestId('renamePanelContextMenuItem'));
    expect(utils.getByTestId('customModalFieldText')).toBeInTheDocument();

    fireEvent.input(utils.getByTestId('customModalFieldText'), {
      target: { value: 'renamed panel' },
    });
    // act(() => {
      // });
    console.log('modal button', screen.getByTestId('runModalButton'));
    fireEvent.click(screen.getByTestId('runModalButton'));
    screen.debug();
      
    await waitFor(() => {
      expect(coreRefs.http.post).toBeCalledTimes(1);
    });
  });

  it('render panel view so container and reload dashboard', async () => {
    // store.dispatch(setPanelList([sampleSavedObjectPanelWithVisualization]));
    const utils = renderPanelView(sampleSavedObjectPanelWithVisualization);

    fireEvent.click(utils.getByTestId('panelActionContextMenu'));
    fireEvent.click(utils.getByTestId('reloadPanelContextMenuItem'));
    expect(utils.container.firstChild).toMatchSnapshot();
  });
});
