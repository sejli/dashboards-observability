/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import httpClientMock from '../../../../../../test/__mocks__/httpClientMock';
import { PanelGridSO } from '../panel_grid_so';
import PPLService from '../../../../../services/requests/ppl';
import { VisualizationType } from '../../../../../../common/types/custom_panels';
import { coreStartMock } from '../../../../../../test/__mocks__/coreMocks';
import { waitFor } from '@testing-library/react';
import { applyMiddleware, createStore } from 'redux';
import { rootReducer } from '../../../../../framework/redux/reducers';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';

describe('Panel Grid SO Component', () => {
  configure({ adapter: new Adapter() });
  const store = createStore(rootReducer, applyMiddleware(thunk));

  it('renders panel grid so component with empty visualizations', async () => {
    const core = coreStartMock;
    const panelId = '';
    const panelVisualizations: VisualizationType[] = [];
    const setPanelVisualizations = jest.fn();
    const editMode = false;
    const start = 'now-15m';
    const end = 'now';
    const onRefresh = false;
    const cloneVisualization = jest.fn();
    const pplFilterValue = '';
    const showFlyout = jest.fn();
    const editActionType = '';
    const onEditClick = (savedVisId: string) => {
      window.location.assign(`#/event_analytics/explorer/${savedVisId}`);
    };

    const wrapper = mount(
      <Provider store={store}>
        <PanelGridSO
          panelId={panelId}
          chrome={core.chrome}
          panelVisualizations={panelVisualizations}
          setPanelVisualizations={setPanelVisualizations}
          editMode={editMode}
          startTime={start}
          endTime={end}
          onRefresh={onRefresh}
          cloneVisualization={cloneVisualization}
          pplFilterValue={pplFilterValue}
          showFlyout={showFlyout}
          editActionType={editActionType}
          onEditClick={onEditClick}
        />
      </Provider>
    );
    wrapper.update();

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });
});
