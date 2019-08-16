/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import request from 'request-promise-native'
import server from '../server';

it('should work', async (done) => {
	request.get('/search')
})

