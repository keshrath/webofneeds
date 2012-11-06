/*
 * Copyright 2012  Research Studios Austria Forschungsges.m.b.H.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package won.server.service.impl;

import won.protocol.model.Connection;
import won.protocol.model.Need;

import java.net.URI;

/**
 * User: fkleedorfer
 * Date: 06.11.12
 */
public class URIService
{
  private URI needURIPrefix;
  private URI connectionURIPrefix;
  public URI createNeedURI(Need need){
    return URI.create(needURIPrefix.toString() + "/" + need.getId());
  }

  public URI createConnectionURI(Connection con){
    return URI.create(needURIPrefix.toString() + "/" + con.getId());
  }
}
